import React, { useEffect, useState } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { DataGrid } from '@mui/x-data-grid';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import API from '../utils/api';

export default function Ledger() {
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verify, setVerify] = useState(null);

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
    { field: 'block', headerName: 'Block Hash', width: 240 },
    { field: 'prevBlock', headerName: 'Prev Hash', width: 240 },
    { field: 'type', headerName: 'Transaction Type', width: 180, renderCell: (params) => (
      <Chip label={params.value} color={params.value.includes('Consent') ? 'primary' : 'default'} size="small" />
    ) },
    { field: 'entity', headerName: 'Entity', width: 140 },
    { field: 'by', headerName: 'By', width: 140 },
    { field: 'timestamp', headerName: 'Timestamp', width: 180, valueGetter: (params) => {
      const t = (params && (params.row?.timestamp ?? params.value)) || null;
      if (!t) return '';
      const d = new Date(t);
      return isNaN(d.getTime()) ? '' : d.toLocaleString();
    } },
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
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" onClick={async () => {
              try {
                const res = await API.get('/ledger/_internal/verify');
                setVerify(res.data);
              } catch {}
            }}>Verify Chain</Button>
            {verify && (
              <Chip label={verify.valid ? 'Chain valid' : 'Chain broken'} color={verify.valid ? 'success' : 'error'} />
            )}
          </Stack>
          <DataGrid rows={ledger} columns={columns} pageSize={5} rowsPerPageOptions={[5]} disableSelectionOnClick autoHeight loading={loading} getRowId={row => row._id} />
        </Stack>
      </CardContent>
    </Card>
  );
} 