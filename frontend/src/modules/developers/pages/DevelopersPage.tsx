import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import DownloadIcon from '@mui/icons-material/Download';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { PageHeader } from '../../../components/PageHeader';
import { paths } from '../../../routes/paths';
import { ApiCodeBlock } from '../components/ApiCodeBlock';
import { ApiEndpointDoc } from '../components/ApiEndpointDoc';
import {
  API_BASE_URL,
  COMMON_ERROR_CODES,
  ENVELOPE_DOCS,
  PREDICTION_RESPONSE_FIELDS,
  PUBLIC_API_ENDPOINTS,
} from '../content/publicApiDocs';
import { downloadPostmanCollection } from '../utils/postmanCollection';

const AUTH_HEADER = `Authorization: Bearer prx_live_xxxxxxxx
Content-Type: application/json`;

export function DevelopersPage() {
  return (
    <Stack spacing={3}>
      <PageHeader
        title="Developer Portal"
        subtitle="REST API reference for OMS and checkout integrations"
        action={
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadPostmanCollection}>
            Download Postman Collection
          </Button>
        }
      />

      <Alert severity="info">
        PredixRoute exposes two separate public APIs. Use <strong>predict-only</strong> endpoints for RTO
        checks before booking. Use <strong>evaluate-and-verify</strong> only when shipping and you want COD
        WhatsApp confirmation.
      </Alert>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" alignItems="center" gap={1}>
              <VpnKeyIcon color="primary" />
              <Typography variant="h6" fontWeight={600}>
                Authentication
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              All endpoints require a Bearer API key. Create scoped keys in the dashboard — each endpoint lists
              its required scope below.
            </Typography>
            <ApiCodeBlock title="Headers" code={AUTH_HEADER} language="http" />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignSelf: 'flex-start' }}>
              <Button component={RouterLink} to={paths.app.apiKeys} variant="outlined">
                Manage API Keys
              </Button>
              <Button variant="contained" startIcon={<DownloadIcon />} onClick={downloadPostmanCollection}>
                Postman Collection
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h6" fontWeight={600}>
              Response envelope
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Every successful response wraps the payload in a consistent envelope. Include{' '}
              <Typography component="code" variant="body2">
                requestId
              </Typography>{' '}
              when contacting support.
            </Typography>
            <ApiCodeBlock title="Success envelope" code={ENVELOPE_DOCS.success} />
            <ApiCodeBlock title="Error envelope" code={ENVELOPE_DOCS.error} />
            <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Error code</TableCell>
                    <TableCell>HTTP</TableCell>
                    <TableCell>When</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {COMMON_ERROR_CODES.map((err) => (
                    <TableRow key={err.name}>
                      <TableCell>
                        <Typography component="code" variant="body2" fontWeight={600}>
                          {err.name}
                        </Typography>
                      </TableCell>
                      <TableCell>{err.type}</TableCell>
                      <TableCell>{err.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" gap={1}>
              <CodeIcon color="primary" />
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  API 1 — Predict only
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pre-booking RTO checks. Never messages the customer.
                </Typography>
              </Box>
              <Chip label="No WhatsApp" size="small" color="default" sx={{ ml: 'auto' }} />
            </Stack>

            <Divider />

            <ApiEndpointDoc
              method="POST"
              path={`${API_BASE_URL}/public/risk/evaluate`}
              scope="risk:evaluate"
              statusCode={200}
              description="Evaluate RTO risk for a single shipment. Returns courier recommendation, risk score, and explainability factors."
              request={PUBLIC_API_ENDPOINTS.evaluate.request}
              response={PUBLIC_API_ENDPOINTS.evaluate.response}
              responseFields={PREDICTION_RESPONSE_FIELDS}
            />

            <Divider />

            <ApiEndpointDoc
              method="POST"
              path={`${API_BASE_URL}/public/batch/evaluate`}
              scope="batch"
              statusCode={201}
              description="Evaluate up to your plan's batch limit in one request. Each item uses the same schema as single evaluate."
              request={PUBLIC_API_ENDPOINTS.batchEvaluate.request}
              response={PUBLIC_API_ENDPOINTS.batchEvaluate.response}
              responseFields={PUBLIC_API_ENDPOINTS.batchEvaluate.responseFields}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" gap={1}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  API 2 — Predict + COD verify
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Booking flow only. Starts WhatsApp COD confirmation for eligible MEDIUM+ risk orders with phone.
                </Typography>
              </Box>
              <Chip label="WhatsApp COD" size="small" color="warning" sx={{ ml: 'auto' }} />
            </Stack>

            <Divider />

            <ApiEndpointDoc
              method="POST"
              path={`${API_BASE_URL}/public/risk/evaluate-and-verify`}
              scope="cod:verify"
              statusCode={201}
              description="Creates a prediction and attempts to start COD WhatsApp verification. Check codVerification.triggered in the response."
              request={PUBLIC_API_ENDPOINTS.evaluateAndVerify.request}
              response={PUBLIC_API_ENDPOINTS.evaluateAndVerify.response}
              responseFields={PUBLIC_API_ENDPOINTS.evaluateAndVerify.responseFields}
            />

            <Divider />

            <ApiEndpointDoc
              method="POST"
              path={`${API_BASE_URL}/public/batch/evaluate-and-verify`}
              scope="cod:verify"
              statusCode={201}
              description="Batch variant of evaluate-and-verify. Returns prediction + codVerification per item."
              request={PUBLIC_API_ENDPOINTS.batchEvaluateAndVerify.request}
              response={PUBLIC_API_ENDPOINTS.batchEvaluateAndVerify.response}
              responseFields={PUBLIC_API_ENDPOINTS.batchEvaluateAndVerify.responseFields}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Typography variant="h6" fontWeight={600}>
              Training data — Outcome API (optional)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              After enabling data sharing in Settings, push closed shipments (delivered/RTO) from your OMS. Send
              real outcomes only — never include PredixRoute risk scores. Admin reviews before platform retrain.
            </Typography>

            <ApiEndpointDoc
              method="POST"
              path={`${API_BASE_URL}/public/shipments/outcome`}
              scope="risk:evaluate"
              statusCode={201}
              description="Ingest a batch of shipment outcomes for model training contribution."
              request={PUBLIC_API_ENDPOINTS.shipmentOutcome.request}
              response={PUBLIC_API_ENDPOINTS.shipmentOutcome.response}
              responseFields={PUBLIC_API_ENDPOINTS.shipmentOutcome.responseFields}
            />
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
