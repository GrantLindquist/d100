import { ReactNode } from 'react';
import { useAlert } from '@/hooks/useAlert';
import { generateUUID } from '@/utils/uuid';
import { getDownloadURL, ref, uploadBytes } from '@firebase/storage';
import db, { storage } from '@/utils/firebase';
import { ImageUrl } from '@/types/Unit';
import { arrayUnion, doc, updateDoc } from '@firebase/firestore';
import { useCampaign } from '@/hooks/useCampaign';

const FileDropzone = ({
  children,
  unitId,
}: {
  children: ReactNode;
  unitId: string;
}) => {
  const { displayAlert } = useAlert();
  const { campaign } = useCampaign();

  const uploadFile = async (file: File) => {
    if (campaign) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = async () => {
        const ratio = img.naturalWidth / img.naturalHeight;
        const imageId = unitId + '-' + generateUUID();
        const imageRef = ref(storage, `${campaign.id}/${imageId}`);
        await uploadBytes(imageRef, file);
        const fileUrl = await getDownloadURL(imageRef);
        const imageUrl: ImageUrl = {
          src: fileUrl,
          ratio: ratio,
        };
        await updateDoc(doc(db, 'units', unitId), {
          imageUrls: arrayUnion(imageUrl),
        });
      };
    }
  };

  function dropHandler(e: any) {
    e.preventDefault();
    try {
      if (e.dataTransfer?.items) {
        [...e.dataTransfer.items].forEach((item, i) => {
          if (item.kind === 'file') {
            const file = item.getAsFile();
            file && uploadFile(file);
          }
        });
      } else {
        if (e.dataTransfer?.files) {
          [...e.dataTransfer.files].forEach((file, i) => {
            uploadFile(file);
          });
        }
      }
    } catch (err: any) {
      displayAlert({
        message: 'An error occurred while dropping your files.',
        isError: true,
        errorType: err.message,
      });
    }
  }

  return (
    <div
      onDrop={dropHandler}
      onDragOver={(event) => event.preventDefault()}
      style={{ minHeight: '90vh' }}
    >
      {children}
    </div>
  );
};
export default FileDropzone;
