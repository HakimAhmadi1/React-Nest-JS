import { AlertTriangle } from "lucide-react";
import Button from "./Button";
import Modal from "./Modal";

/**
 * ConfirmDialog - wraps Modal for simple yes/no delete/action confirmations.
 * Props: isOpen, onClose, onConfirm, title, message, confirmLabel, loading
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Delete",
  loading = false,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
        <AlertTriangle size={24} className="text-red-400" />
      </div>
      <p className="text-sm text-gray-400">{message}</p>
      <div className="flex gap-3 w-full">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          className="flex-1 !bg-red-600 !text-white hover:!bg-red-500"
          onClick={onConfirm}
          loading={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);

export default ConfirmDialog;
