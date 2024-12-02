import { Article } from '@/types/Unit';
import { Box, Card, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import { useRouter } from 'next/navigation';
import ImageFrame from '@/components/content/ImageFrame';

const HeaderAsideSx = {
  '&:hover': {
    cursor: 'pointer',
  },
  fontWeight: BOLD_FONT_WEIGHT,
  paddingY: 0.5,
};
const SubheaderAsideSx = {
  '&:hover': {
    cursor: 'pointer',
  },
  paddingLeft: 3,
  paddingY: 0.5,
};

const ArticleAside = (props: { article: Article }) => {
  const router = useRouter();
  return (
    <Card>
      {props.article.imageUrls.length > 0 && (
        <ImageFrame
          image={props.article.imageUrls[0]}
          alt={props.article.title}
        />
      )}
      <Box
        py={2}
        px={3}
        maxHeight={300}
        sx={{
          overflowY: 'auto',
        }}
      >
        {props.article.sections.map((section, index) => {
          if (!section.title.trim()) {
            return null;
          }
          return (
            <Typography
              key={index}
              sx={index === 0 ? HeaderAsideSx : SubheaderAsideSx}
              onClick={() => router.push(`#${section.title}`)}
            >
              {section.title}
            </Typography>
          );
        })}
        {props.article.type === 'quest' && (
          <>
            <Typography
              onClick={() => router.push('#Quest Timeline')}
              sx={HeaderAsideSx}
            >
              Quest Timeline
            </Typography>
            <Typography
              onClick={() => router.push('#Loot Table')}
              sx={HeaderAsideSx}
            >
              Loot Table
            </Typography>
          </>
        )}
        {props.article.imageUrls.length > 0 && (
          <Typography
            onClick={() => router.push('#Reference Images')}
            sx={HeaderAsideSx}
          >
            Reference Images
          </Typography>
        )}
      </Box>
    </Card>
  );
};
export default ArticleAside;
