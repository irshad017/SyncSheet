









import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useParams } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { FixedSizeGrid as Grid } from 'react-window';
import AddCollaboratorForm from './RealTimeCollaboration/addCollaborator';
import Footer from './Spreadsheet/SSFooter';
import Header from './Spreadsheet/SSHeader';
import { faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import toast from 'react-hot-toast';
import axios from 'axios';

const rowLength = 999;
const columnLength = 27;

const getColumnLabel = (index) => String.fromCharCode(65 + index); // Convert 0 to 'A', 1 to 'B', etc.

const Cell = memo(({ rowIndex, columnIndex, style, data }) => {
  const { cells, selectedCell, selectCell, handleBlur, handleKeyDown, cellRefs } = data;
  const cell = (cells[rowIndex] && cells[rowIndex][columnIndex]) || ''; // Safely accessing the cell value

  const isHeaderRow = rowIndex === 0;
  const isHeaderColumn = columnIndex === 0;

  return (
    <div
      onClick={() => !isHeaderRow && !isHeaderColumn && selectCell(rowIndex, columnIndex)}
      style={{
        ...style,
        border: selectedCell.row === rowIndex && selectedCell.col === columnIndex ? '2px solid #000' : '1px solid #ddd',
        backgroundColor: isHeaderRow || isHeaderColumn ? '#f2f2f2' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        overflow: 'hidden',
        whiteSpace: 'pre-wrap',
        textAlign: 'center',
        cursor: isHeaderRow || isHeaderColumn ? 'default' : 'text',
      }}
      ref={(el) => (cellRefs.current[`${rowIndex}-${columnIndex}`] = el)}
      contentEditable={!isHeaderRow && !isHeaderColumn}
      suppressContentEditableWarning
      onBlur={(e) => !isHeaderRow && !isHeaderColumn && handleBlur(rowIndex, columnIndex, e)}
      onKeyDown={(e) => !isHeaderRow && !isHeaderColumn && handleKeyDown(rowIndex, columnIndex, e)}
    >
      {isHeaderRow ? (isHeaderColumn ? '' : getColumnLabel(columnIndex - 1)) : (isHeaderColumn ? rowIndex : cell)}
    </div>
  );
});

function Spreadsheet() {
  const { id } = useParams();
  const [cells, setCells] = useState(Array.from({ length: rowLength }, () => Array(columnLength).fill('')));
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
  const [ws, setWs] = useState(null);
  const [cellHeight, setCellHeight] = useState(22); // Default height
  const [cellWidth, setCellWidth] = useState(90); // Default width
  const [gridWidth, setGridWidth] = useState(1280); // Default grid width
  const containerRef = useRef(null);
  const cellRefs = useRef({});
  const clientId = useRef(`client-${Math.random().toString(36).substr(2, 9)}`);
  const sheetId = localStorage.getItem('sheetId');
  const [user, setUser] = useState(null); // Initialized to null
  const [temp, setTemp] = useState([]);
  const [UserName, setUserName] = useState('');
  const [title, setTitle] = useState('')

  useEffect(() => {
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem('userId');
      try {
        const userResponse = await axios.get(`http://localhost:5000/api/user/${userId}`);
        setUser(userResponse.data);
        setUserName(userResponse.data.username)
        const item = userResponse.data.spreadsheet
        const name = item.filter(e => e._id === id)[0].name
        setTitle(name)
        // console.log("Hey",userResponse.data.spreadsheet.filter(item => item._id === id)[0].name);
        // console.log("she",userResponse.data.spreadsheet.filter(item => item._id === id));
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    fetchUserDetails();
    return () => {
      setTemp([]);
      setUser(null); // Reset to null
    };
  }, [id]);

  useEffect(() => {
    const fetchSpreadsheet = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:5000/api/spreadsheet/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`, // Include the token in the Authorization header
          },
        });
        const data = await response.json();
        console.log('Spreadsheet data:', data);

        // Ensure the data is valid
        if (data && Array.isArray(data) && data.length === rowLength) {
          setCells(data);
        } else {
          // Set to default if data is invalid or doesn't match expected dimensions
          setCells(Array.from({ length: rowLength }, () => Array(columnLength).fill('')));
        }
      } catch (error) {
        console.error('Error fetching spreadsheet data:', error);
        // Handle fetch error by setting default cells
        setCells(Array.from({ length: rowLength }, () => Array(columnLength).fill('')));
      }
    };

    fetchSpreadsheet();

    const connectWebSocket = () => {
      const wsClient = new WebSocket(`ws://localhost:5000/?spreadsheetId=${id}&clientId=${clientId.current}`);

      wsClient.onopen = () => {
        setWs(wsClient);
        console.log('WebSocket connected');
      };

      wsClient.onmessage = (event) => {
        const { type, cells: updatedCells, selectedCell: updatedSelectedCell, id: msgId } = JSON.parse(event.data);
        if (msgId === id) {
          if (type === 'update') {
            setCells(updatedCells);
          } else if (type === 'select') {
            setSelectedCell(updatedSelectedCell);
          }
        }
      };

      wsClient.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      wsClient.onclose = (event) => {
        console.log('WebSocket disconnected. Reconnecting...', event.reason);
        setTimeout(connectWebSocket, 100); // Attempt to reconnect after 1 second
      };

      return wsClient;
    };

    const wsClient = connectWebSocket();

    return () => {
      wsClient.close();
    };
  }, [id]);

  useEffect(() => {
    const updateGridWidth = () => {
      if (containerRef.current) {
        setGridWidth(containerRef.current.offsetWidth);
      }
    };

    updateGridWidth();
    window.addEventListener('resize', updateGridWidth);

    return () => {
      window.removeEventListener('resize', updateGridWidth);
    };
  }, []);

  const debouncedUpdateCell = useCallback(
    debounce((row, col, value) => {
      if (ws) {
        const op = { type: 'update', row, col, value };
        ws.send(JSON.stringify({ ...op, clientId: clientId.current }));
      }
    }, 300),
    [ws]
  );

  const updateCell = (row, col, value) => {
    const updatedCells = cells.map((r, rowIndex) =>
      rowIndex === row ? r.map((c, colIndex) => (colIndex === col ? value : c)) : r
    );
    setCells(updatedCells);
    debouncedUpdateCell(row, col, value);
  };

  const selectCell = useCallback((row, col) => {
    setSelectedCell({ row, col });

    if (ws) {
      const message = { type: 'select', row, col, clientId: clientId.current };
      ws.send(JSON.stringify(message));
    }
  }, [ws]);

  const handleBlur = useCallback((row, col, e) => {
    const value = e.target.textContent;
    updateCell(row, col, value);
  }, [updateCell]);

  const handleKeyDown = useCallback((row, col, e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextRow = row + 1;
      if (nextRow < rowLength) {
        const nextCell = cellRefs.current[`${nextRow}-${col}`];
        if (nextCell) {
          nextCell.focus();
          selectCell(nextRow, col);
        }
      }
    }
  }, [selectCell]);

  if (!cells) {
    return <div>Loading....</div>;
  }
  if (!cells[0]) {
    return <div>Spreadsheet not loaded</div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className='mt-0 flex text-center items-center justify-center bg-gray-200 w-full h-10'>
                <div className='absolute left-3 sm:left-4 flex sm:gap-1 items-center'>
                  <a href='/workspace' className='py-1'>
                      <FontAwesomeIcon  className='w-8 h-7 pt-1 text-blue-700' icon={faArrowAltCircleLeft} />
                  </a>
                  <a href='/workspace' className='text-center font-medium sm:text-lg'>Back</a>
                </div>
                <p className="text-sm md:text-lg text-center font-bold mb-1">Title: {title} </p>
                <span className='absolute right-2 text-sm font-medium invisible sm:visible'>Username: {UserName} </span>
          </div>
        <div style={{ marginBottom: '10px' }}>
        <AddCollaboratorForm spreadsheetId={id} />
        
        </div >
          <div className="flex-grow overflow-hidden px-2 " ref={containerRef}>
            <Grid
              columnCount={columnLength}
              columnWidth={cellWidth}
              height={window.innerHeight - 100}
              rowCount={rowLength}
              rowHeight={cellHeight}
              width={gridWidth}
              itemData={{
                cells,
                selectedCell,
                selectCell,
                handleBlur,
                handleKeyDown,
                cellRefs,
              }}
            >
              {Cell}
            </Grid>
        </div>
      <Footer />
    </div>
  );
}

export default Spreadsheet;
