import { Article } from '@/types/Unit';
import { Box, Card, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import { useRouter } from 'next/navigation';

const ArticleAside = (props: { article: Article }) => {
  const router = useRouter();
  return (
    <Card>
      <Box py={2} px={3}>
        {props.article.sections.map((section, index) => {
          if (!section.title.trim()) {
            return null;
          }
          return (
            <Typography
              key={index}
              py={0.5}
              sx={{
                '&:hover': {
                  cursor: 'pointer',
                },
                ...(index === 0
                  ? {
                      fontWeight: BOLD_FONT_WEIGHT,
                    }
                  : {
                      pl: 3,
                    }),
              }}
              onClick={() => router.push(`#${section.title}`)}
            >
              {section.title}
            </Typography>
          );
        })}
        {props.article.imageUrls.length > 0 && (
          <Typography
            onClick={() => router.push('#Reference Images')}
            py={0.5}
            pl={3}
            sx={{
              ':hover': {
                cursor: 'pointer',
              },
            }}
          >
            Reference Images
          </Typography>
        )}
      </Box>
    </Card>
  );
};
export default ArticleAside;
