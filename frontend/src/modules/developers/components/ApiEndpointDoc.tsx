import {
  Box,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { ApiCodeBlock } from './ApiCodeBlock';

export type ResponseField = {
  name: string;
  type: string;
  description: string;
};

type ApiEndpointDocProps = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  scope: string;
  statusCode: number;
  description: string;
  request?: string;
  response: string;
  responseFields?: ResponseField[];
};

const METHOD_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
  GET: 'success',
  POST: 'primary',
  PATCH: 'warning',
  DELETE: 'error',
};

export function ApiEndpointDoc({
  method,
  path,
  scope,
  statusCode,
  description,
  request,
  response,
  responseFields,
}: ApiEndpointDocProps) {
  return (
    <Stack spacing={2.5}>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1}>
        <Chip label={method} color={METHOD_COLORS[method]} size="small" sx={{ fontWeight: 700, minWidth: 56 }} />
        <Typography
          component="code"
          sx={{
            fontFamily: 'monospace',
            fontSize: 14,
            fontWeight: 600,
            bgcolor: 'action.hover',
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          {path}
        </Typography>
        <Chip label={`Scope: ${scope}`} size="small" variant="outlined" />
        <Chip label={`${statusCode} OK`} size="small" variant="outlined" color="success" />
      </Stack>

      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>

      {request && (
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Request body
          </Typography>
          <ApiCodeBlock title="application/json" code={request} />
        </Box>
      )}

      <Box>
        <Typography variant="subtitle2" fontWeight={600} gutterBottom>
          Response body
        </Typography>
        <ApiCodeBlock title={`${statusCode} application/json`} code={response} />
      </Box>

      {responseFields && responseFields.length > 0 && (
        <Box>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Response fields
          </Typography>
          <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell width="22%">Field</TableCell>
                  <TableCell width="18%">Type</TableCell>
                  <TableCell>Description</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {responseFields.map((field) => (
                  <TableRow key={field.name}>
                    <TableCell>
                      <Typography component="code" variant="body2" fontWeight={600}>
                        {field.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {field.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{field.description}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
