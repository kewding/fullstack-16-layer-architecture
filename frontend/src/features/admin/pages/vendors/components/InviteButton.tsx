import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { VendorInviteModal } from './VendorInviteModal';

export function VendorInviteButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        className="text-black gap-2 p-3"
        onClick={() => setShowModal(true)}
      >
        <Upload />
        <span>Invite Vendor</span>
      </Button>

      {showModal && <VendorInviteModal onClose={() => setShowModal(false)} />}
    </>
  );
}