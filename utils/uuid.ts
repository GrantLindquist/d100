export const generateUUID = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const generateStorageRef = (title: string, id: string) => {
  return `${title}-${id}`;
};
