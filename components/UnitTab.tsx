import { ImageUrl, Unit, UnitDisplayValues } from '@/types/Unit';
import { ChangeEvent, ReactNode } from 'react';
import { Box, Card, Checkbox, Stack, Tooltip, Typography } from '@mui/material';
import ImageFrame from '@/components/content/ImageFrame';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import Link from 'next/link';

type UnitTabProps = {
  unit: Unit;
  checked?: boolean;
  icon: ReactNode;
  isEditing: boolean;
  updateState: (removeId: boolean, unit: Unit) => void;
  imageUrl?: ImageUrl;
}

type UnitTabWrapperProps = {
  props: UnitTabProps;
  children: ReactNode;
};

const UnitTabWrapper = ({ props, children }: UnitTabWrapperProps) => {
  if (props.isEditing) {
    return <>{children}</>;
  }

  // Otherwise, wrap with Link
  return (
    <Link
      href={`/campaigns/${props.unit.campaignId}/${props.unit.type}s/${props.unit.id}`}
      style={{
        color: 'inherit',
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
};

export const CondensedUnitTab = (props: UnitTabProps) => {

  const handleCheck = (event: ChangeEvent<HTMLInputElement>) => {
    props.updateState(!event.target.checked, props.unit);
  };

  return (
    <UnitTabWrapper props={props}>
      <Stack direction={'row'} spacing={1} alignItems={'center'} mx={1}
             sx={{
               cursor: 'pointer',
               color: 'grey',
             }}
      >
        {props.icon}
        <Typography>{props.unit.title}{props.unit.hidden && ' (hidden)'}</Typography>
        <Box display={'flex'} justifyContent={'center'} alignItems={'center'}>
          {props.isEditing && (
            <Checkbox
              checked={props.checked}
              onChange={handleCheck}
              sx={{
                p: 0,
                ':hover': {
                  backgroundColor: 'rgba(0,0,0,0)',
                },
              }}
            />
          )}
        </Box>
      </Stack>
    </UnitTabWrapper>
  );
};

export const UnitTab = (props: UnitTabProps) => {

  const handleCheck = (event: ChangeEvent<HTMLInputElement>) => {
    props.updateState(!event.target.checked, props.unit);
  };

  return (
    <UnitTabWrapper props={props}>
      <Card
        variant="outlined"
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0)',
          borderColor: '#444444',
          borderWidth: '2px',
          cursor: 'pointer',
          ':hover': !props.isEditing
            ? {
              backgroundColor: 'rgba(28, 28, 28)',
            }
            : {},
        }}
      >
        {props.imageUrl && (
          <ImageFrame image={props.imageUrl} alt={props.unit.title} />
        )}
        <Stack
          direction={'row'}
          spacing={1}
          sx={{
            pl: 1,
            pr: 2,
            py: 1,
          }}
        >
          <Stack direction={'row'} spacing={1} flexGrow={1}>
            <Stack direction={'column'}>
              {props.icon}
              {props.unit.hidden && (
                <Tooltip title={'Hidden from players'}>
                  <VisibilityOffIcon sx={{ color: 'grey' }} />
                </Tooltip>
              )}
            </Stack>
            <Stack direction={'column'}>
              <Typography fontWeight={BOLD_FONT_WEIGHT}>
                {props.unit.title}
              </Typography>
              <Typography color={'grey'}>
                {UnitDisplayValues[props.unit.type]}
              </Typography>
            </Stack>
          </Stack>
          <Box width={25} display={'flex'} justifyContent={'center'} alignItems={'center'}>
            {props.isEditing && (
              <Checkbox
                checked={props.checked}
                onChange={handleCheck}
                sx={{
                  p: 0,
                  ':hover': {
                    backgroundColor: 'rgba(0,0,0,0)',
                  },
                }}
              />
            )}
          </Box>
        </Stack>
      </Card>
    </UnitTabWrapper>
  );
};
