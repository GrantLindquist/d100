import { Article } from '@/types/Unit';
import { Box, Card, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
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

// TODO: Titles sometimes disappear when article is toggled hidden
const ArticleAside = (props: { titles: string[]; article: Article }) => {
  // TODO: Make section title temporarily highlight when this activates
  const scrollToTitle = (title: string) => {
    const targetElement = document.getElementById(title);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  return (
    <Card sx={{ userSelect: 'none' }}>
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
        {props.titles.map((title, index) => {
          return (
            <Typography
              key={index}
              sx={index === 0 ? HeaderAsideSx : SubheaderAsideSx}
              onClick={() => scrollToTitle(title)}
            >
              {title}
            </Typography>
          );
        })}
        {props.article.type === 'quest' && (
          <>
            <Typography
              onClick={() => scrollToTitle('Quest Timeline')}
              sx={HeaderAsideSx}
            >
              Quest Timeline
            </Typography>
            <Typography
              onClick={() => scrollToTitle('Loot Table')}
              sx={HeaderAsideSx}
            >
              Loot Table
            </Typography>
          </>
        )}
        {props.article.imageUrls.length > 0 && (
          <Typography
            onClick={() => scrollToTitle('Reference Images')}
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
