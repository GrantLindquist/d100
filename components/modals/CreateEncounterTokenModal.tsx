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
      tokenCopies: 1,
    });

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (user) {
        try {
          const newEncounterTokens = [];
          for (let i = 0; i < formData.tokenCopies; i++) {
            const newEncounterToken: EncounterToken = {
              id: generateUUID(),
              title: formData.tokenCopies > 1 ? `${formData.tokenTitle} (${i + 1})` : formData.tokenTitle,
              currentHitPoints: formData.tokenHitPoints,
              maxHitPoints: formData.tokenHitPoints,
              tempHitPoints: 0,
              isPlayer: formData.tokenIsPlayer === 'on',
              deathSaves: null,
              isDead: false,
              ...(formProps.selectedArticle ? { articleId: formProps.selectedArticle.id } : {}),
            };
            newEncounterTokens.push(newEncounterToken);
          }
          await updateDoc(doc(db, 'units', props.encounter.id), {
            tokens: [...props.encounter.tokens, ...newEncounterTokens],
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

    const handleInputChange = (event: ChangeEvent<HTMLInputElement>, inputValue?: any) => {
      const { name, value } = event.target;
      setFormData((prevData) => ({
        ...prevData,
        [name]: inputValue || value,
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
          <Stack direction={'row'} spacing={1}>
            <Stack direction={'column'} spacing={1}>
              <InputLabel>Starting HP</InputLabel>
              <TextField
                name="tokenHitPoints"
                variant="outlined"
                size="small"
                type="number"
                value={formData.tokenHitPoints}
                onChange={handleInputChange}
              />
            </Stack>
            <Stack direction={'column'} spacing={1}>
              <InputLabel>Copies</InputLabel>
              <TextField
                name="tokenCopies"
                variant="outlined"
                size="small"
                type="number"
                value={formData.tokenCopies}
                onChange={handleInputChange}
              />
            </Stack>
          </Stack>
          <FormControlLabel
            control={
              <Checkbox
                name="tokenIsPlayer"
                checked={formData.tokenIsPlayer === 'on'}
                onChange={(event) => handleInputChange(event, formData.tokenIsPlayer === 'on' ? 'off' : 'on')}
              />
            }
            label="Is Player/Ally"
          />
          <Button type="submit" disabled={!formData.tokenTitle.trim() || formData.tokenCopies < 1}>
            {selectedArticle ? `Add ${selectedArticle.title}` : `Create Token${formData.tokenCopies > 1 ? 's' : ''}`}
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