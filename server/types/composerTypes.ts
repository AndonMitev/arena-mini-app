export type ComposerActionFormResponse = {
  type: 'form';
  title: string;
  url: string;
};

export type ComposerActionMetadata = {
  type: 'composer';
  name: string;
  icon: string;
  description: string;
  aboutUrl: string;
  imageUrl: string;
  action: {
    type: 'post';
  };
};
