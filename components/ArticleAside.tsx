import { Article } from '@/types/Unit';
import { Card, CardContent, Typography } from '@mui/material';
import { BOLD_FONT_WEIGHT } from '@/utils/globals';
import Link from 'next/link';

const ArticleAside = (props: { article: Article }) => {
  return (
    <Card
      sx={{
        position: 'sticky',
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
            <Link href={`#${section.title}`}>{section.title}</Link>
          </Typography>
        ))}
        {props.article.imageUrls.length > 0 && (
          <Typography py={0.5} pl={3}>
            <Link href={`#Reference Images`}>Reference Images</Link>
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
export default ArticleAside;
