import { Encounter, EncounterToken } from '@/types/Encounter';
import { ChangeEvent, FormEvent, useState } from 'react';
import { useUser } from '@/hooks/useUser';
import { useAlert } from '@/hooks/useAlert';
import { generateUUID } from '@/utils/uuid';
import { doc, updateDoc } from '@firebase/firestore';
import db from '@/utils/firebase';
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  InputLabel,
  Menu,
  Modal,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import { MODAL_STYLE } from '@/utils/globals';
import ExistingEncounterTokenList from '@/components/data-list/ExistingEncounterTokenList';
import { Article } from '@/types/Unit';
import { SmallIconButton } from '@/components/buttons/SmallIconButton';
import AddIcon from '@mui/icons-material/Add';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const CreateEncounterTokenModal = (props: { encounter: Encounter }) => {
  const theme = useTheme();

  const [open, setOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const handleCloseMenu = () => {
    setOpen(false);
    setSelectedArticle(null);
  };

  const CreateEncounterTokenForm = (formProps: { selectedArticle: Article | null }) => {
    const { user } = useUser();
    const { displayAlert } = useAlert();
    const [formData, setFormData] = useState({
      tokenTitle: formProps.selectedArticle?.title ?? '',
      tokenHitPoints: formProps.selectedArticle?.encounterTokenDefaultHP ?? 1,
      tokenIsPlayer: 'off',
      tokenCopies: 1,
    });

    const [menuAnchor, setMenuAnchor] = useState(null);

    const handleOpenMenu = (event: any) => {
      setMenuAnchor(event.currentTarget);
    };

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
          handleCloseMenu();
        } catch (e: any) {
          displayAlert({
            message: 'An error occurred while creating a token.',
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

    // TODO: Set a value cap to the number fields here
    return (
      <form onSubmit={handleSubmit}>
        <Menu anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              transformOrigin={{ horizontal: 'left', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              sx={{
                'ul': {
                  backgroundColor: '#222',
                },
              }}
        >
          <ExistingEncounterTokenList
            selectArticle={(article: Article | null) => setSelectedArticle(article)}
            selectedArticle={selectedArticle} />
        </Menu>
        <Stack spacing={1}>
          <Stack direction={'row'} alignItems={'center'}>
            <InputLabel style={{ flexGrow: 1 }}>Token Title</InputLabel>
            <Typography onClick={handleOpenMenu} color={theme.palette.primary.main}
                        sx={{ cursor: 'pointer', px: .5 }}>create from article</Typography>
            <Tooltip
              title={'To register an Article as an Encounter Token, open the Article, select the + icon, and select the "Encounter Token" option'}
              placement={'top'}
            >
              <InfoOutlinedIcon
                sx={{ color: 'grey', height: 16, width: 16 }}
              />
            </Tooltip>
          </Stack>
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
                sx={{
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  },
                }}
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
                sx={{
                  '& input[type=number]': {
                    MozAppearance: 'textfield',
                    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                      WebkitAppearance: 'none',
                      margin: 0,
                    },
                  },
                }}
              />
            </Stack>
            <Box width={'40%'}></Box>
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
      <SmallIconButton icon={<AddIcon />} onClick={() => setOpen(true)} />
      <Modal open={open} onClose={handleCloseMenu}>
        <Box sx={MODAL_STYLE}>
          <Stack direction={'row'} spacing={2}>
            <CreateEncounterTokenForm selectedArticle={selectedArticle} />
          </Stack>
        </Box>
      </Modal>
    </>
  );
};
export default CreateEncounterTokenModal;