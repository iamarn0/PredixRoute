import { Box, IconButton, Stack, Typography } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useState } from 'react';

type ApiCodeBlockProps = {
  title?: string;
  code: string;
  language?: string;
};

export function ApiCodeBlock({ title, code, language = 'json' }: ApiCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#0F172A',
      }}
    >
      {(title || language) && (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1.5, py: 0.75, bgcolor: '#1E293B', borderBottom: '1px solid #334155' }}
        >
          <Typography variant="caption" color="#94A3B8" fontWeight={600} textTransform="uppercase">
            {title ?? language}
          </Typography>
          <IconButton size="small" onClick={handleCopy} sx={{ color: '#94A3B8' }} aria-label="Copy code">
            <ContentCopyIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>
      )}
      <Box
        component="pre"
        sx={{
          m: 0,
          p: 2,
          overflow: 'auto',
          fontSize: 12.5,
          lineHeight: 1.6,
          color: '#E2E8F0',
          fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
        }}
      >
        {code}
      </Box>
      {copied && (
        <Typography variant="caption" sx={{ px: 2, pb: 1, display: 'block', color: '#34D399' }}>
          Copied to clipboard
        </Typography>
      )}
    </Box>
  );
}
