import { Badge, Button, Group, Table, Text } from "@mantine/core";
import type { AdminListItemDTO } from "@kineDao.com/api-types/admin-management";

interface AdminListTableProps {
	admins: AdminListItemDTO[];
	currentUserId: string;
	revokingUserId: string | null;
	onRevoke: (userId: string) => void;
}

export function AdminListTable({
	admins,
	currentUserId,
	revokingUserId,
	onRevoke,
}: AdminListTableProps) {
	return (
		<Table highlightOnHover>
			<Table.Thead>
				<Table.Tr>
					<Table.Th>Name</Table.Th>
					<Table.Th>Email</Table.Th>
					<Table.Th>Roles</Table.Th>
					<Table.Th>Created</Table.Th>
					<Table.Th>Actions</Table.Th>
				</Table.Tr>
			</Table.Thead>
			<Table.Tbody>
				{admins.map((admin) => {
					const isSelf = admin.userId === currentUserId;
					const isRevoking = revokingUserId === admin.userId;

					return (
						<Table.Tr key={admin.userId}>
							<Table.Td>
								<Text size="sm" fw={600}>
									{admin.name}
								</Text>
							</Table.Td>
							<Table.Td>
								<Text size="sm">{admin.email}</Text>
							</Table.Td>
							<Table.Td>
								<Group gap="xs">
									{admin.roles.map((role) => (
										<Badge
											key={`${admin.userId}-${role}`}
											color={role === "super_admin" ? "red" : "blue"}
											variant="light"
										>
											{role}
										</Badge>
									))}
								</Group>
							</Table.Td>
							<Table.Td>
								<Text size="sm">
									{new Date(admin.createdAt).toLocaleDateString()}
								</Text>
							</Table.Td>
							<Table.Td>
								<Button
									size="xs"
									color="red"
									variant="light"
									disabled={isSelf}
									loading={isRevoking}
									onClick={() => onRevoke(admin.userId)}
								>
									Revoke
								</Button>
							</Table.Td>
						</Table.Tr>
					);
				})}
			</Table.Tbody>
		</Table>
	);
}

