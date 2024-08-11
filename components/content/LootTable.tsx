'use client';
import { Loot } from '@/types/Unit';
import { useState } from 'react';
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

const LootTable = (props: { questId: string; isEditing: boolean }) => {
  const [loot, setLoot] = useState<Loot[]>([
    {
      title: 'loot',
      currencyType: 'gp',
      currencyQuantity: 100,
    },
    {
      title: 'loot',
      currencyType: 'cp',
      currencyQuantity: 1000,
    },
    {
      title: 'loot',
      currencyType: 'pp',
      currencyQuantity: null,
    },
  ]);
  const [isAdding, setAdding] = useState(false);

  const handleAddLoot = async () => {
    setAdding(false);
  };

  const EditableRow = (props: { loot?: Loot }) => {
    return (
      // <form onSubmit={handleAddLoot}>
      <TableRow sx={{ ' td,th': { border: 0 } }}>
        <TableCell>
          <TextField size={'small'} placeholder={'Item Name'} fullWidth />
        </TableCell>
        <TableCell>
          <Stack direction={'row'} spacing={1}>
            <TextField
              sx={{ maxWidth: '85px' }}
              size={'small'}
              type={'number'}
            />
            <Select value={'gp'} size={'small'}>
              <MenuItem value={'pp'}>pp</MenuItem>
              <MenuItem value={'gp'}>gp</MenuItem>
              <MenuItem value={'sp'}>sp</MenuItem>
              <MenuItem value={'cp'}>cp</MenuItem>
            </Select>
          </Stack>
        </TableCell>
      </TableRow>
      // </form>
    );
  };

  return (
    <Box py={2}>
      <Typography variant={'h4'}>Loot Table</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={'70%'}>Item Name</TableCell>
              <TableCell>Value (x total)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loot.map((item, index) =>
              props.isEditing ? (
                <EditableRow key={index} loot={item} />
              ) : (
                <TableRow
                  key={index}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {item.title}
                  </TableCell>
                  <TableCell>
                    {item.currencyQuantity ? (
                      <>
                        {item.currencyQuantity}
                        {item.currencyType}
                      </>
                    ) : (
                      <>-</>
                    )}
                  </TableCell>
                </TableRow>
              )
            )}
            {isAdding && <EditableRow />}
          </TableBody>
        </Table>
      </TableContainer>
      {isAdding ? (
        <Button onClick={handleAddLoot}>Save</Button>
      ) : (
        <Button onClick={() => setAdding(true)}>Add Item</Button>
      )}
    </Box>
  );
};
export default LootTable;
