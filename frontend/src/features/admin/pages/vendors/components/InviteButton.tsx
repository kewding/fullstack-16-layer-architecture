import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { useState } from 'react';
import { VendorInviteModal } from './VendorInviteModal';

interface VendorInviteButtonProps {
  onInvited: () => void;
}

export function VendorInviteButton({ onInvited }: VendorInviteButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        variant="default"
        className="gap-2 p-3 bg-[#3F6F64] text-white hover:bg-white hover:text-[#3F6F64] border border-[#3F6F64] transition-colors"
        onClick={() => setShowModal(true)}
      >
        <Upload />
        <span>Invite Vendor</span>
      </Button>

      {showModal && <VendorInviteModal onClose={() => setShowModal(false)} onInvited={onInvited} />}
    </>
  );
}
