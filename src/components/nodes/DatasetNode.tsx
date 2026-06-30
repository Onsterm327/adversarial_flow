import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Chip, Box } from '@mui/material';
import { Storage as DatasetIcon } from '@mui/icons-material';
import { NodeData } from '@/types';
import { BaseNode } from './BaseNode';

export const DatasetNode = memo(function DatasetNode(props: NodeProps) {
  const data = props.data as unknown as NodeData;

  return (
    <BaseNode {...props} hasTarget={false} hasSource={true}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Chip
          icon={<DatasetIcon sx={{ fontSize: 14 }} />}
          label={data.label}
          size="small"
          variant="outlined"
          sx={{
            height: 24,
            fontSize: '0.7rem',
            borderColor: 'divider',
            alignSelf: 'flex-start',
          }}
        />
      </Box>
    </BaseNode>
  );
});
