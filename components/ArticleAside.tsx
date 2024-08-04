import { Article } from '@/types/Scoop';
import { Card, CardContent, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';

const ArticleAside = (props: { article: Article }) => {
  return (
    <Card
      sx={{
        width: '100%',
      }}
    >
      <CardContent>
        {props.article.sections.map((section, index) => (
          <Typography
            key={section.id}
            py={0.5}
            sx={
              index === 0
                ? {
                    fontWeight: BOLD_FONT_WEIGHT,
                  }
                : {
                    pl: 3,
                  }
            }
          >
            {section.title}
          </Typography>
        ))}
      </CardContent>
    </Card>
  );
};
export default ArticleAside;
