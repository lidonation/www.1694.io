import {
    Card,
    CardContent,
    CardActions,
    Box,
    Typography,
    Button,
  } from '@mui/material';
  import React from 'react';
  
  interface RecordsNotFoundProps {
    message?: string;
    actionText?: string;
    onActionClick?: () => void;
    height?: string | number;
  }
  
  const RecordsNotFound: React.FC<RecordsNotFoundProps> = ({
    message = 'No records found.',
    actionText,
    onActionClick,
    height = '60vh',
  }) => {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height={height}
        px={2}
      >
        <Card
          sx={{
            borderRadius: 4,
            boxShadow: 1,
            maxWidth: 500,
            width: '100%',
            textAlign: 'center',
          }}
        >
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {message}
            </Typography>
          </CardContent>
  
          {actionText && onActionClick && (
            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
              <Button
                onClick={onActionClick}
                variant="contained"
                sx={{
                  borderRadius: '9999px',
                  textTransform: 'none',
                  backgroundColor: '#002e9f',
                  '&:hover': { backgroundColor: '#001c6f' },
                }}
              >
                {actionText}
              </Button>
            </CardActions>
          )}
        </Card>
      </Box>
    );
  };
  
  export default RecordsNotFound;
  