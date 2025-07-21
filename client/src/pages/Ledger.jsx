import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import API from '../utils/api';

export default function Ledger() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLedger() {
      setLoading(true);
      try {
        const res = await API.get('/ledger');
        setLedger(res.data);
      } catch (err) {}
      setLoading(false);
    }
    fetchLedger();
  }, []);

  const columns = [
    { field: 'id', headerName: '#', width: 60 },
    { field: 'block', headerName: 'Block Hash', width: 140 },
    { field: 'type', headerName: 'Transaction Type', width: 180, renderCell: (params) => (
      <Chip label={params.value} color={params.value.includes('Consent') ? 'primary' : 'default'} size="small" />
    ) },
    { field: 'entity', headerName: 'Entity', width: 140 },
    { field: 'by', headerName: 'By', width: 140 },
    { field: 'timestamp', headerName: 'Timestamp', width: 160 },
  ];

  return (
    <Card sx={{ maxWidth: 900, mx: 'auto', mt: 2, bgcolor: 'background.paper', boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" color="primary" fontWeight="bold" gutterBottom>
          Blockchain Ledger
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This ledger shows blockchain transactions for health data. Each transaction is immutable and linked to a block hash.
        </Typography>
        <Stack>
          <DataGrid rows={ledger} columns={columns} pageSize={5} rowsPerPageOptions={[5]} disableSelectionOnClick autoHeight loading={loading} getRowId={row => row.id} />
        </Stack>
      </CardContent>
    </Card>
  );
} 