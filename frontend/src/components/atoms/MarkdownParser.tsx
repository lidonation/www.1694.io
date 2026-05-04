'use client';
import React from 'react';
import {
  Box,
  Typography,
  Link,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkBreaks from 'remark-breaks';
import 'katex/dist/katex.min.css';
import { Components } from 'react-markdown';

type MarkdownParserProps = {
  text: string;
};

interface CodeProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

interface LinkProps {
  href?: string;
  children?: React.ReactNode;
}

interface ImageProps {
  src?: string;
  alt?: string;
}

const MarkdownParser = ({ text }: MarkdownParserProps) => {
  if (!text) {
    return null;
  }

  const isSimpleText = (str: string): boolean => {
    const trimmed = str.trim();
    return (
      trimmed.length <= 5 ||
      (/^[a-zA-Z0-9\s\-_.]+$/.test(trimmed) &&
        !trimmed.includes('\n') &&
        !trimmed.includes('*') &&
        !trimmed.includes('#') &&
        !trimmed.includes('['))
    );
  };

  const cleanText = text.replace(/<br\s*\/?>/gi, '\n');

  if (isSimpleText(cleanText)) {
    return (
      <Typography component="p" sx={{ lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {cleanText}
      </Typography>
    );
  }

  const components: Components = {
    h1: ({ children }) => (
      <Typography
        variant="h1"
        component="h1"
        sx={{ fontWeight: 400, fontSize: '1.2rem' }}
      >
        {children}
      </Typography>
    ),
    h2: ({ children }) => (
      <Typography
        variant="h2"
        component="h2"
        sx={{ fontWeight: 400, fontSize: '1.05rem' }}
      >
        {children}
      </Typography>
    ),
    h3: ({ children }) => (
      <Typography
        variant="h3"
        component="h3"
        sx={{ fontWeight: 400, fontSize: '0.9rem' }}
      >
        {children}
      </Typography>
    ),
    h4: ({ children }) => (
      <Typography
        variant="h4"
        component="h4"
        sx={{ fontWeight: 400, fontSize: '0.75rem' }}
      >
        {children}
      </Typography>
    ),
    h5: ({ children }) => (
      <Typography
        variant="h5"
        component="h5"
        sx={{ fontWeight: 400, fontSize: '0.65rem' }}
      >
        {children}
      </Typography>
    ),
    h6: ({ children }) => (
      <Typography
        variant="h6"
        component="h6"
        sx={{ fontWeight: 400, fontSize: '0.65rem' }}
      >
        {children}
      </Typography>
    ),

    // Paragraphs
    p: ({ children }) => (
      <Typography component="p" sx={{ lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {children}
      </Typography>
    ),

    // Lists
    li: ({ children }) => (
      <Box
        component="li"
        sx={{
          display: 'list-item',
        }}
      >
        <Typography component="p">{children}</Typography>
      </Box>
    ),
    ol: ({ children }) => (
      <Box component="ol" sx={{ pl: 4, listStyle: 'decimal', my: 1 }}>
        {children}
      </Box>
    ),
    ul: ({ children }) => (
      <Box component="ul" sx={{ pl: 4, listStyle: 'disc', my: 1 }}>
        {children}
      </Box>
    ),

    // Emphasis
    em: ({ children }) => (
      <Typography component="em" sx={{ fontStyle: 'italic' }}>
        {children}
      </Typography>
    ),
    strong: ({ children }) => (
      <Typography component="strong" sx={{ fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),

    // Links
    a: ({ href, children }: LinkProps) => (
      <Link
        href={href || '#'}
        target={href?.startsWith('http') ? '_blank' : '_self'}
        rel="noopener"
      >
        {children}
      </Link>
    ),

    // Images
    img: ({ src, alt }: ImageProps) => (
      <Box
        component="img"
        src={src || ''}
        alt={alt || ''}
        sx={{ maxWidth: '100%', my: 1 }}
      />
    ),

    // Blockquotes
    blockquote: ({ children }) => (
      <Paper
        elevation={0}
        sx={{
          pl: 2,
          py: 0.5,
          my: 1,
          borderLeft: 4,
          borderColor: 'grey.300',
          bgcolor: 'grey.50',
        }}
      >
        {children}
      </Paper>
    ),

    // Code
    code: ({ node, inline, className, children, ...props }: CodeProps) => {
      return !inline ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            my: 1,
            bgcolor: 'grey.100',
            borderRadius: 1,
            overflowX: 'auto',
          }}
        >
          <Typography
            component="pre"
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              m: 0,
            }}
          >
            <Box
              component="code"
              className={className || ''}
              sx={{ display: 'block' }}
              {...props}
            >
              {children}
            </Box>
          </Typography>
        </Paper>
      ) : (
        <Typography
          component="code"
          sx={{
            px: 0.5,
            py: 0.25,
            fontFamily: 'monospace',
            bgcolor: 'grey.100',
            borderRadius: 0.5,
            fontSize: '85%',
          }}
          {...props}
        >
          {children}
        </Typography>
      );
    },

    // Horizontal Rule
    hr: () => <Divider sx={{ my: 1 }} />,

    // Tables
    table: ({ children }) => (
      <TableContainer component={Paper} elevation={0} sx={{ my: 1 }}>
        <Table size="small">{children}</Table>
      </TableContainer>
    ),
    thead: ({ children }) => <TableHead>{children}</TableHead>,
    tbody: ({ children }) => <TableBody>{children}</TableBody>,
    tr: ({ children }) => <TableRow>{children}</TableRow>,
    th: ({ children }) => (
      <TableCell component="th" sx={{ fontWeight: 'bold' }}>
        {children}
      </TableCell>
    ),
    td: ({ children }) => <TableCell>{children}</TableCell>,

    br: () => <br />,
  };

  return (
    <ReactMarkdown
      components={components}
      remarkPlugins={[remarkBreaks]}
      // remarkPlugins={[remarkMath]}
      // rehypePlugins={[rehypeKatex]}
    >
      {cleanText?.toString()}
    </ReactMarkdown>
  );
};

export default MarkdownParser;