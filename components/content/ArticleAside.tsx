import { Article } from '@/types/Unit';
import { Box, Card, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import ImageFrame from '@/components/content/ImageFrame';
import '@/components/content/text-editor/EditorContent.css';

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

const ArticleAside = (props: { titles: string[]; article: Article }) => {
  const scrollToHeader = (headerText: string) => {
    const headerElement = Array.from(document.querySelectorAll('h2')).find(
      (header) => header.innerHTML === headerText
    );

    // TODO: Make section title temporarily highlight when this activates
    if (headerElement) {
      const rect = headerElement.getBoundingClientRect();
      const offset = window.scrollY || document.documentElement.scrollTop;
      const targetPosition =
        rect.top + offset - (headerText === props.article.title ? 100 : 85);

      // console.log(headerElement);
      // headerElement.classList.add('highlight');
      // setTimeout(() => {
      //   headerElement.classList.remove('highlight');
      // }, 500);

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth',
      });
    } else {
      console.error('Header not found:', headerText);
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
              onClick={() => scrollToHeader(title)}
            >
              {title}
            </Typography>
          );
        })}
        {props.article.type === 'quest' && (
          <>
            {/*<Typography*/}
            {/*  onClick={() => scrollToHeader('Quest Timeline')}*/}
            {/*  sx={HeaderAsideSx}*/}
            {/*>*/}
            {/*  Quest Timeline*/}
            {/*</Typography>*/}
            <Typography
              onClick={() => scrollToHeader('Loot Table')}
              sx={HeaderAsideSx}
            >
              Loot Table
            </Typography>
          </>
        )}
        {props.article.imageUrls.length > 0 && (
          <Typography
            onClick={() => scrollToHeader('Reference Images')}
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
