import { Encounter, EncounterToken } from '@/types/Encounter';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';
import { generateUUID } from '@/utils/uuid';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import { Box, Button, Checkbox, FormControlLabel, InputLabel, Modal, Stack, TextField } from '@mui/material';
import { MODAL_STYLE } from '@/utils/globals';
import ExistingEncounterTokenList from '@/components/data-list/ExistingEncounterTokenList';
import { Article } from '@/types/Unit';

const CreateEncounterTokenModal = (props: { encounter: Encounter }) => {
  const [open, setOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const CreateEncounterTokenForm = (formProps: { selectedArticle: Article | null }) => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [formData, setFormData] = useState({
      tokenTitle: formProps.selectedArticle?.title ?? '',
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
            ...(formProps.selectedArticle ? { articleId: formProps.selectedArticle.id } : {}),
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
            {selectedArticle ? `Add ${selectedArticle.title}` : 'Create Token'}
          </Button>
        </Stack>
      </form>
    );
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>Add Token</Button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={MODAL_STYLE} minHeight={370} width={700}>
          <Stack direction={'row'} spacing={2}>
            <Box width={'70%'}>
              <CreateEncounterTokenForm selectedArticle={selectedArticle} />
            </Box>
            <Box width={'30%'}>
              <ExistingEncounterTokenList
                selectArticle={(article: Article | null) => setSelectedArticle(article)}
                selectedArticle={selectedArticle} />
            </Box>
          </Stack>
        </Box>
      </Modal>
    </>
  );
};
export default CreateEncounterTokenModal;