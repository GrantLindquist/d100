import { Stack, TextField, Typography } from '@mui/material';
import { Section } from '@/types/Unit';

export const SectionComponent = (props: { section: Section }) => {
  return (
    <Stack spacing={2} id={props.section.title}>
      <Typography variant={props.section.isHeader ? 'h2' : 'h4'}>
        {props.section.title}
      </Typography>
      <Typography>{props.section.body}</Typography>
    </Stack>
  );
};

// TODO: Figure out how to have my cake (onFocus id state) and eat it too (one click to access TextField)
export const EditableSection = (props: { section: Section }) => {
  return (
    <Stack spacing={2}>
      <TextField
        name={`title-${props.section.id}`}
        defaultValue={props.section.title}
        placeholder="Section Title"
        // onFocus={() => setFocusedSectionId(props.section.id)}
        sx={{
          '& .MuiInputBase-input': {
            fontSize: props.section.isHeader ? '4rem' : '2rem',
            fontStyle: 'italic',
            p: 0,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
        fullWidth
      />
      <TextField
        name={`body-${props.section.id}`}
        defaultValue={props.section.body}
        placeholder="Section Body"
        // onFocus={() => setFocusedSectionId(props.section.id)}
        sx={{
          '& .MuiInputBase-input': {
            fontStyle: 'italic',
          },
          '& .MuiInputBase-root': {
            p: 0,
          },
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
        }}
        multiline
        fullWidth
      />
    </Stack>
  );
};
