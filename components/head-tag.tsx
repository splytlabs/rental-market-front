import Head from 'next/head';

type HeadTagProps = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
};

const HeadTag = ({ title, description, url, imageUrl }: HeadTagProps) => {
  return (
    <Head>
      <title>{title}</title>
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" href="/splyt-logo.svg" type="image/svg+xml" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:site_name" content="Yozm" />
      <meta property="og:locale" content="ko_KR" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    </Head>
  );
};

export default HeadTag;
