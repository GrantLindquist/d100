'use client';
import { useEffect, useState } from 'react';
import {
  Box,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import { generateUUID } from '@/utils/uuid';
import { CurrencyType, Loot } from '@/types/Unit';
import { doc, onSnapshot, updateDoc } from '@firebase/firestore';
import { useAlert } from '@/hooks/useAlert';
import db from '@/utils/firebase';
import { BOLD_FONT_WEIGHT, SUBTITLE_VARIANT } from '@/utils/globals';
import RoundButton from '@/components/buttons/RoundButton';
import AddIcon from '@mui/icons-material/Add';

const EditableTable = (props: { questId: string }) => {
  const { displayAlert } = useAlert();

  const [rows, setRows] = useState<Loot[]>([]);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editRowData, setEditRowData] = useState<Partial<Loot>>({});

  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(
        doc(db, 'units', props.questId),
        (questDocSnap) => {
          if (questDocSnap.exists()) {
            setRows(questDocSnap.data().loot as Loot[]);
          }
        }
      );

      return () => unsubscribe();
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while loading quest loot.`,
        isError: true,
        errorType: e.message,
      });
    }
  }, [props.questId]);

  const calculateCurrencyTotal = () => {
    let total = 0;

    for (let row of rows) {
      let currencyQuantity = row.currencyQuantity;
      switch (row.currencyType) {
        case 'cp':
          currencyQuantity = currencyQuantity / 100;
          break;
        case 'sp':
          currencyQuantity = currencyQuantity / 10;
          break;
        case 'pp':
          currencyQuantity = currencyQuantity * 10;
          break;
      }
      total += currencyQuantity;
    }

    return Math.round(total * 100) / 100;
  };

  const updateTable = async (data: Loot[]) => {
    try {
      await updateDoc(doc(db, 'units', props.questId), {
        loot: data,
      });
    } catch (e: any) {
      displayAlert({
        message: `An error occurred while updating the loot table.`,
        isError: true,
        errorType: e.message,
      });
    }
  };

  const handleEditRow = (row: Loot) => {
    setEditRowId(row.id);
    setEditRowData(row);
  };

  const handleDeleteRow = async (id: string) => {
    let newData = rows.filter((row) => row.id !== id);
    setRows(newData);
    setEditRowId(null);
    setEditRowData({});
    await updateTable(newData);
  };

  const handleSaveClick = async (id: string) => {
    let newData = rows.map((row) =>
      row.id === id ? { ...row, ...editRowData } : row
    );
    await updateTable(newData);
    setEditRowId(null);
    setRows(newData);
    setEditRowData({});
  };

  const handleInputChange = (event: any, isNumber: boolean) => {
    const { name, value } = event.target;
    if (name) {
      setEditRowData((prev) =>
        !isNumber
          ? { ...prev, [name]: value as string }
          : {
              ...prev,
              [name]: Number(value),
            }
      );
    }
  };

  const handleAddRow = () => {
    const newRow = {
      id: generateUUID(),
      title: '',
      currencyQuantity: 0,
      currencyType: 'gp' as CurrencyType,
    };

    setRows((prevRows) => [...prevRows, newRow]);
    setEditRowId(newRow.id);
    setEditRowData({});
  };

  return (
    <>
      <Typography
        id={'Loot Table'}
        fontWeight={BOLD_FONT_WEIGHT}
        variant={SUBTITLE_VARIANT}
        pb={2}
      >
        Loot ({calculateCurrencyTotal()}gp)
      </Typography>
      <TableContainer sx={{ marginBottom: 1 }}>
        <Table>
          {rows.length > 0 && (
            <TableHead>
              <TableRow>
                <TableCell>Item Name</TableCell>
                <TableCell align="right">Currency</TableCell>
                <TableCell align="right" width={'120px'}></TableCell>
              </TableRow>
            </TableHead>
          )}
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  '&:hover .editButton': { opacity: '1' },
                }}
              >
                <TableCell>
                  {editRowId === row.id ? (
                    <TextField
                      size="small"
                      name="title"
                      value={editRowData.title || ''}
                      onChange={(event) => handleInputChange(event, false)}
                    />
                  ) : (
                    <Typography>{row.title}</Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  {editRowId === row.id ? (
                    <>
                      <TextField
                        size="small"
                        name="currencyQuantity"
                        value={editRowData.currencyQuantity || 0}
                        onChange={(event) => handleInputChange(event, true)}
                        sx={{
                          maxWidth: 150,
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Select
                                size="small"
                                name="currencyType"
                                value={editRowData.currencyType || 'gp'}
                                onChange={(event) =>
                                  handleInputChange(event, false)
                                }
                                sx={{
                                  '& .MuiOutlinedInput-notchedOutline': {
                                    border: 'none',
                                  },
                                }}
                              >
                                <MenuItem value="cp">cp</MenuItem>
                                <MenuItem value="sp">sp</MenuItem>
                                <MenuItem value="gp">gp</MenuItem>
                                <MenuItem value="pp">pp</MenuItem>
                              </Select>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </>
                  ) : (
                    <Typography>
                      {row.currencyQuantity !== 0
                        ? `${row.currencyQuantity} ${row.currencyType}`
                        : '-'}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {editRowId === row.id ? (
                    <>
                      <IconButton onClick={() => handleSaveClick(row.id)}>
                        <CheckIcon />
                      </IconButton>
                      <IconButton onClick={() => handleDeleteRow(row.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </>
                  ) : (
                    <Box
                      className={'editButton'}
                      sx={{
                        opacity: '0',
                      }}
                    >
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditRow(row);
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <RoundButton icon={<AddIcon />} onClick={handleAddRow}>
        Add Row
      </RoundButton>
    </>
  );
};

export default EditableTable;
