import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Chip, Box } from '@mui/material';
import { Memory as ModelIcon } from '@mui/icons-material';
import { NodeData } from '@/types';
import { BaseNode } from './BaseNode';

export const ModelNode = memo(function ModelNode(props: NodeProps) {
  const data = props.data as unknown as NodeData;

  return (
    <BaseNode {...props} hasTarget={true} hasSource={true}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Chip
          icon={<ModelIcon sx={{ fontSize: 14 }} />}
          label={data.label}
          size="small"
          variant="outlined"
          color="success"
          sx={{ height: 24, fontSize: '0.7rem', alignSelf: 'flex-start' }}
        />
      </Box>
    </BaseNode>
  );
});
