import React, { useEffect, useState, useRef, useCallback, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { FixedSizeGrid as Grid } from 'react-window';
import AddCollaboratorForm from './RealTimeCollaboration/addCollaborator';
import Footer from './Spreadsheet/SSFooter';
import Header from './Spreadsheet/SSHeader';
import { faArrowAltCircleLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL, WS_BASE_URL } from '../config/api';

const rowLength = 999;
const columnLength = 27;

const getColumnLabel = (index) => String.fromCharCode(65 + index);

const Cell = memo(({ rowIndex, columnIndex, style, data }) => {
  const { cells, selectedCell, selectCell, handleBlur, handleKeyDown, cellRefs } = data;
  const cell = (cells[rowIndex] && cells[rowIndex][columnIndex]) || '';

  const isHeaderRow = rowIndex === 0;
  const isHeaderColumn = columnIndex === 0;
  const isSelected = selectedCell.row === rowIndex && selectedCell.col === columnIndex;

  return (
    <div
      onClick={() => !isHeaderRow && !isHeaderColumn && selectCell(rowIndex, columnIndex)}
      style={{
        ...style,
        border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
        backgroundColor: isHeaderRow || isHeaderColumn ? '#f9fafb' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isHeaderColumn || isHeaderRow ? 'center' : 'flex-start',
        paddingLeft: isHeaderColumn || isHeaderRow ? '0px' : '6px',
        paddingRight: isHeaderColumn || isHeaderRow ? '0px' : '6px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        fontSize: '12px',
        fontWeight: isHeaderRow || isHeaderColumn ? '600' : '400',
        color: isHeaderRow || isHeaderColumn ? '#4b5563' : '#111827',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        textOverflow: 'ellipsis',
        cursor: isHeaderRow || isHeaderColumn ? 'default' : 'text',
        userSelect: isHeaderRow || isHeaderColumn ? 'none' : 'text',
      }}
      ref={(el) => {
        if (!isHeaderRow && !isHeaderColumn) {
          cellRefs.current[`${rowIndex}-${columnIndex}`] = el;
        }
      }}
      contentEditable={!isHeaderRow && !isHeaderColumn}
      suppressContentEditableWarning
      onBlur={(e) => !isHeaderRow && !isHeaderColumn && handleBlur(rowIndex, columnIndex, e)}
      onKeyDown={(e) => !isHeaderRow && !isHeaderColumn && handleKeyDown(rowIndex, columnIndex, e)}
    >
      {isHeaderRow
        ? isHeaderColumn
          ? ''
          : getColumnLabel(columnIndex - 1)
        : isHeaderColumn
        ? rowIndex
        : cell}
    </div>
  );
});

Cell.displayName = 'Cell';

function Spreadsheet() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cells, setCells] = useState(
    Array.from({ length: rowLength }, () => Array(columnLength).fill(''))
  );
  const [selectedCell, setSelectedCell] = useState({ row: -1, col: -1 });
  const [ws, setWs] = useState(null);
  const [cellHeight] = useState(26);
  const [cellWidth] = useState(100);
  const [gridWidth, setGridWidth] = useState(1280);
  const [gridHeight, setGridHeight] = useState(600);
  const containerRef = useRef(null);
  const cellRefs = useRef({});
  const clientId = useRef(`client-${Math.random().toString(36).substr(2, 9)}`);
  const [userName, setUserName] = useState('');
  const [title, setTitle] = useState('');
  const [createdDate, setCreatedDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Authenticate and fetch metadata
  useEffect(() => {
    let isMounted = true;
    const fetchUserDetails = async () => {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');
      if (!userId || !token) {
        toast.error('Please login to view spreadsheet');
        navigate('/');
        return;
      }

      try {
        const userResponse = await axios.get(`${API_BASE_URL}/api/user/${userId}`);
        if (!isMounted) return;

        if (userResponse.data) {
          setUserName(userResponse.data.username || '');
          const spreadsheets = userResponse.data.spreadsheet || [];
          const found = spreadsheets.find((item) => (item._id || item) === id);
          if (found && typeof found === 'object') {
            setTitle(found.name || 'Spreadsheet');
            if (found.date) {
              setCreatedDate(new Date(found.date).toLocaleDateString());
            }
          } else {
            setTitle('Spreadsheet');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user details:', error);
      }
    };

    fetchUserDetails();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Fetch spreadsheet cell data & WebSocket connection with proper cleanup
  useEffect(() => {
    let isMounted = true;
    let wsClient = null;
    let reconnectTimeout = null;

    const fetchSpreadsheet = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`${API_BASE_URL}/api/spreadsheet/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `Bearer ${token}` : '',
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            // Normalize rows and columns to expected dimensions
            const normalized = Array.from({ length: rowLength }, (_, r) =>
              Array.from({ length: columnLength }, (_, c) =>
                data[r] && data[r][c] !== undefined ? String(data[r][c]) : ''
              )
            );
            setCells(normalized);
          }
        }
      } catch (error) {
        console.error('Error fetching spreadsheet data:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSpreadsheet();

    const connectWebSocket = () => {
      if (!isMounted) return;

      try {
        wsClient = new WebSocket(
          `${WS_BASE_URL}/?spreadsheetId=${id}&clientId=${clientId.current}`
        );

        wsClient.onopen = () => {
          if (isMounted) {
            setWs(wsClient);
          }
        };

        wsClient.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            const { type, cells: updatedCells, selectedCell: updatedSelectedCell, id: msgId } = data;

            if (msgId === id) {
              if (type === 'deleted') {
                toast.error(data.message || 'This spreadsheet was deleted by the owner.');
                setTimeout(() => {
                  navigate('/workspace');
                }, 1200);
                return;
              } else if (type === 'update' && Array.isArray(updatedCells)) {
                setCells(updatedCells);
              } else if (type === 'select' && updatedSelectedCell) {
                setSelectedCell(updatedSelectedCell);
              }
            }
          } catch (e) {
            console.error('WS message parse error:', e);
          }
        };

        wsClient.onerror = (error) => {
          console.error('WebSocket connection error:', error);
        };

        wsClient.onclose = () => {
          if (!isMounted) return;
          // Reconnect after 2 seconds
          reconnectTimeout = setTimeout(connectWebSocket, 2000);
        };
      } catch (wsErr) {
        console.error('WebSocket setup error:', wsErr);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (wsClient) {
        wsClient.onclose = null; // Prevent reconnect loop on intentional unmount
        wsClient.close();
      }
    };
  }, [id]);

  // Dynamic grid resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setGridWidth(containerRef.current.offsetWidth);
        setGridHeight(containerRef.current.offsetHeight);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const resizeTimer = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      clearTimeout(resizeTimer);
    };
  }, []);

  const debouncedSendWSUpdate = useCallback(
    debounce((row, col, value) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const op = { type: 'update', row, col, value, clientId: clientId.current };
        ws.send(JSON.stringify(op));
      }
    }, 250),
    [ws]
  );

  const updateCell = useCallback(
    (row, col, value) => {
      setCells((prev) => {
        const next = prev.map((r, rIdx) =>
          rIdx === row ? r.map((c, cIdx) => (cIdx === col ? value : c)) : r
        );
        return next;
      });
      debouncedSendWSUpdate(row, col, value);
    },
    [debouncedSendWSUpdate]
  );

  const selectCell = useCallback(
    (row, col) => {
      setSelectedCell({ row, col });
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'select',
            row,
            col,
            clientId: clientId.current,
          })
        );
      }
    },
    [ws]
  );

  const handleBlur = useCallback(
    (row, col, e) => {
      const value = e.target.textContent || '';
      updateCell(row, col, value);
    },
    [updateCell]
  );

  const handleKeyDown = useCallback(
    (row, col, e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const nextRow = row + 1;
        if (nextRow < rowLength) {
          const nextCell = cellRefs.current[`${nextRow}-${col}`];
          if (nextCell) {
            nextCell.focus();
          }
          selectCell(nextRow, col);
        }
      }
    },
    [selectCell]
  );

  // Save spreadsheet to backend
  const handleSaveSpreadsheet = async () => {
    const token = localStorage.getItem('token');
    await axios.post(
      `${API_BASE_URL}/api/spreadsheet/${id}`,
      { cells },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
  };

  // Import CSV data into grid
  const handleImportCSV = (importedRows) => {
    if (!importedRows || !importedRows.length) return;
    const newCells = Array.from({ length: rowLength }, (_, r) =>
      Array.from({ length: columnLength }, (_, c) => {
        if (importedRows[r] && importedRows[r][c] !== undefined) {
          return String(importedRows[r][c]);
        }
        return cells[r] ? cells[r][c] || '' : '';
      })
    );
    setCells(newCells);
    // Broadcast via HTTP save to sync all clients
    handleSaveSpreadsheet();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white">
      {/* Top action header */}
      <Header
        sheetId={id}
        title={title}
        cells={cells}
        onSave={handleSaveSpreadsheet}
        onImport={handleImportCSV}
      />

      {/* Sub-header navigation & title */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/workspace')}
            className="flex items-center space-x-1.5 text-blue-600 hover:text-blue-800 text-sm font-semibold transition"
          >
            <FontAwesomeIcon icon={faArrowAltCircleLeft} className="w-4 h-4" />
            <span>Workspace</span>
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-xs sm:max-w-md">
            {title || 'Untitled Spreadsheet'}
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs text-gray-500">
          {userName && <span className="hidden sm:inline">User: {userName}</span>}
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Connected
          </span>
        </div>
      </div>

      {/* Collaborator bar */}
      <AddCollaboratorForm spreadsheetId={id} />

      {/* Virtualized grid */}
      <div className="flex-1 w-full overflow-hidden bg-gray-100 p-1" ref={containerRef}>
        {loading ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            Loading spreadsheet...
          </div>
        ) : (
          <Grid
            columnCount={columnLength}
            columnWidth={cellWidth}
            height={gridHeight || 550}
            rowCount={rowLength}
            rowHeight={cellHeight}
            width={gridWidth || 1200}
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
        )}
      </div>

      {/* Bottom status footer */}
      <Footer
        title={title}
        date={createdDate}
        onSaveAndGoBack={async () => {
          await handleSaveSpreadsheet();
          navigate('/workspace');
        }}
      />
      <Toaster position="top-right" />
    </div>
  );
}

export default Spreadsheet;
