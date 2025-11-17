import React from 'react';
import { Paper, Box, Typography, Divider, List, ListItem, Link } from '@mui/material';

export default function News({ news }) {
  if (!news || news.length === 0) {
    return (
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">No news available.</Typography>
      </Paper>
    );
  }

  const topStory = news[0];

  return (
    <Paper elevation={2} sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>News Feed & Stock-AI Insights</Typography>
      <Divider sx={{ mb: 2 }} />

      {/* Highlighted top story */}
      <Box sx={{ mb: 2 }}>
        <Link href={topStory.url} target="_blank" rel="noopener" underline="hover">
          <Typography variant="subtitle1" color="primary" fontWeight="bold">
            {topStory.title}
          </Typography>
        </Link>
        <Typography variant="body2" color="text.secondary">
          {topStory.site} · {new Date(topStory.publishedDate).toLocaleDateString()}
        </Typography>
      </Box>

      {/* Additional stories */}
      <List dense>
        {news.slice(1, 4).map((n, idx) => (
          <ListItem key={idx} disableGutters>
            <Link href={n.url} target="_blank" rel="noopener" underline="hover" color="text.primary">
              <Typography variant="body2">• {n.title}</Typography>
            </Link>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
