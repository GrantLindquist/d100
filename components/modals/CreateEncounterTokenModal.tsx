import { Encounter, EncounterToken } from '@/types/Encounter';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';
import { generateUUID } from '@/utils/uuid';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Box, Button, Checkbox, FormControlLabel, InputLabel, Modal, Stack, TextField } from '@mui/material';
import { MODAL_STYLE } from '@/utils/globals';

const CreateEncounterTokenModal = (props: { encounter: Encounter }) => {
  const [open, setOpen] = useState(false);

  const CreateEncounterTokenForm = () => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [formData, setFormData] = useState({
      tokenTitle: '',
      tokenHitPoints: 1,
      tokenIsPlayer: 'off',
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        try {
          const newEncounterToken: EncounterToken = {
            id: generateUUID(),
            title: formData.tokenTitle,
            currentHitPoints: formData.tokenHitPoints,
            maxHitPoints: formData.tokenHitPoints,
            tempHitPoints: 0,
            isPlayer: formData.tokenIsPlayer === 'on',
            deathSaves: null,
            isDead: false,
          };
          await updateDoc(doc(db, 'units', props.encounter.id), {
            tokens: [...props.encounter.tokens, newEncounterToken],
          });
          setOpen(false);
        } catch (e: any) {
          displayAlert({
            message: 'An error occurred while creating a token.',
            isError: true,
            errorType: e.message,
          });
        }
      }
    };

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    };

    return (
      <form onSubmit={handleSubmit}>
        <Stack spacing={1}>
          <InputLabel>Token Title</InputLabel>
          <TextField
            name="tokenTitle"
            variant="outlined"
            size="small"
            fullWidth
            value={formData.tokenTitle}
            onChange={handleInputChange}
          />
          <InputLabel>Starting HP</InputLabel>
          <TextField
            name="tokenHitPoints"
            variant="outlined"
            size="small"
            type="number"
            value={formData.tokenHitPoints}
            onChange={handleInputChange}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="tokenIsPlayer"
                checked={formData.tokenIsPlayer === 'on'}
                onChange={handleInputChange}
              />
            }
            label="Is Player/Ally"
          />
          <Button type="submit" disabled={!formData.tokenTitle.trim()}>
            Create Token
          </Button>
        </Stack>
      </form>
    );
  };


  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Token</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE}>
          <CreateEncounterTokenForm />
        </Box>
      </Modal>
    </>
  );
};
export default CreateEncounterTokenModal;