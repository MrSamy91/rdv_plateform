import { getAdminUsers, type AdminUser } from '@/lib/admin/users'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CalendarCheck, Phone, Mail, Users } from 'lucide-react'
import { RoleSelect } from './role-select'

export const metadata = { title: 'Utilisateurs — Admin CutBook' }

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function UserRow({ user }: { user: AdminUser }) {
  return (
    <TableRow>
      {/* Avatar + Nom */}
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarImage src={user.image ?? ''} alt={user.name} />
            <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{user.name}</span>
        </div>
      </TableCell>

      {/* Email */}
      <TableCell>
        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
          <Mail size={13} className="shrink-0" />
          {user.email}
        </div>
      </TableCell>

      {/* Téléphone */}
      <TableCell>
        {user.phone ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Phone size={13} className="text-muted-foreground shrink-0" />
            {user.phone}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm italic">—</span>
        )}
      </TableCell>

      {/* Nombre de RDV */}
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm tabular-nums">
          <CalendarCheck size={13} className="text-muted-foreground shrink-0" />
          {user._count.bookings}
        </div>
      </TableCell>

      {/* Rôle — cliquable */}
      <TableCell>
        <RoleSelect userId={user.id} currentRole={user.role} />
      </TableCell>

      {/* Inscrit le */}
      <TableCell className="text-muted-foreground text-sm">
        {user.createdAt.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </TableCell>
    </TableRow>
  )
}

export default async function AdminUsersPage() {
  const users = await getAdminUsers()

  return (
    <div className="@container/main flex flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
      {/* En-tête */}
      <div className="flex items-center gap-3">
        <div
          className="flex size-10 items-center justify-center rounded-xl"
          style={{ background: '#489B6E' }}
        >
          <Users size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#253122' }}>
            Utilisateurs
          </h1>
          <p className="text-muted-foreground text-sm">
            {users.length} compte{users.length > 1 ? 's' : ''} enregistré
            {users.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted sticky top-0">
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Nb de RDV</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Inscrit le</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground h-24 text-center">
                  Aucun utilisateur.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => <UserRow key={user.id} user={user} />)
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
