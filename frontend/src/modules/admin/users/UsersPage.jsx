import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { deleteApi, getApi, postApi, putApi } from "@/services/api";
import { useCanAccess } from "@/utils/permissions";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import Badge from "@/components/ui/Badge";
import Table from "@/components/ui/Table";

const CMS_ROLES = [
  { id: "SUPER_ADMIN", name: "Super Admin" },
  { id: "ADMIN", name: "Admin" },
  { id: "EDITOR", name: "Editor" },
  { id: "SUPPORT", name: "Support" },
  { id: "SUBSCRIBER", name: "Subscriber" },
];

const PAGE_SIZE = 10;

const UsersPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // One request per pause, not per keystroke.
  const debouncedSearch = useDebouncedValue(search, 300);

  // Reset paging at the source of the change rather than in an effect that
  // reacts to it afterwards. Without this, searching from page 3 keeps
  // offset=20 and the results look empty.
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setPage(1);
  };

  const canEdit = useCanAccess("user.edit");
  const canDelete = useCanAccess("user.delete");
  const canCreate = useCanAccess("user.create");

  // The response interceptor already unwraps the envelope, so this is the
  // { data, total } payload directly.
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () =>
      getApi("admin/users", {
        search: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
    placeholderData: (previous) => previous,
  });

  const users = data?.data ?? [];
  const total = data?.total ?? 0;

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteApi(`admin/users/${id}`),
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
    // Now actually reachable: apiRequest throws instead of resolving with
    // { success: false }, which used to make every failure look like a success.
    onError: (err) => toast.error(err.message || "Delete failed"),
  });

  const upsertMutation = useMutation({
    mutationFn: (payload) =>
      selectedUser
        ? putApi(`admin/users/${selectedUser.id}`, payload)
        : postApi("admin/users", payload),
    onSuccess: () => {
      toast.success(selectedUser ? "User updated" : "User created");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => toast.error(err.message || "Save failed"),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (r) => <span className="text-gray-500 text-xs">#{r.id}</span>,
    },
    {
      key: "name",
      label: "User",
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-xs text-primary-400 font-bold">
            {r.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-gray-200">{r.name}</span>
            <span className="text-xs text-gray-500">{r.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      label: "Role",
      render: (r) => <Badge variant="info">{r.role || "SUBSCRIBER"}</Badge>,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge variant={r.isActive ? "success" : "danger"}>
          {r.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit2}
              aria-label={`Edit ${r.name}`}
              onClick={() => {
                setSelectedUser(r);
                setModalOpen(true);
              }}
            />
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              aria-label={`Delete ${r.name}`}
              onClick={() => setDeleteTarget(r)}
            />
          )}
        </div>
      ),
    },
  ];

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.target).entries());

    const payload = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    // Only send a password when one was actually entered; the backend rejects
    // an empty string.
    if (form.password) payload.password = form.password;

    upsertMutation.mutate(payload);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <p className="text-gray-500 text-sm mt-1">{total} total accounts.</p>
        </div>
        {canCreate && (
          <Button
            icon={Plus}
            onClick={() => {
              setSelectedUser(null);
              setModalOpen(true);
            }}
          >
            Add User
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Search users by name or email"
            placeholder="Search name or email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {isError && (
        <p
          role="alert"
          className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
        >
          {error.message || "Failed to load users."}
        </p>
      )}

      <Table
        columns={columns}
        data={users}
        loading={isLoading}
        emptyMessage="No users found."
        currentPage={page}
        totalItems={total}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedUser(null);
        }}
        title={selectedUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" name="name" defaultValue={selectedUser?.name} required />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={selectedUser?.email}
            required
          />
          <Input
            label={selectedUser ? "New password (leave blank to keep)" : "Password"}
            name="password"
            type="password"
            required={!selectedUser}
            minLength={8}
            hint="At least 8 characters, with an uppercase letter, a lowercase letter and a digit."
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="user-role" className="text-sm font-medium text-gray-300">
              Account role
            </label>
            <select
              id="user-role"
              name="role"
              defaultValue={selectedUser?.role || "SUBSCRIBER"}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 text-gray-100 text-sm px-3 py-2"
            >
              {CMS_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          {upsertMutation.isError && (
            <p
              role="alert"
              className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2"
            >
              {upsertMutation.error?.message || "Something went wrong."}
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => {
                setModalOpen(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" loading={upsertMutation.isPending}>
              {selectedUser ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        loading={deleteMutation.isPending}
        title="Delete user"
        message={`Delete ${deleteTarget?.name}? Their sessions will be revoked immediately.`}
      />
    </div>
  );
};

export default UsersPage;
