'use client'

import { toggleUserStatus, deleteUser, updateUserRole, updateUserProfile } from '@/actions/users'
import { extendTrial, activateSubscription, suspendSubscription } from '@/actions/subscription'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Power, PowerOff, Clock, CheckCircle, PauseCircle, Trash2, Shield, Eye, Pencil, Save } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

type User = {
    id: string
    cuit: string | null
    name: string | null
    email: string | null
    role: string
    isActive: boolean
    subscriptionStatus: string
    subscriptionExpiresAt: Date | null
    trialEndsAt: Date | null
    createdAt: Date
    updatedAt: Date
    acceptedTermsAt: Date | null
    isEmailVerified: boolean
    image: string | null
    invoiceCount: number
    clientCount: number
    config: any
}

type DialogType = 'extendTrial' | 'activate' | 'suspend' | 'delete' | 'role' | 'details' | null

export function UserList({ users, currentUserId }: { users: User[], currentUserId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState<string | null>(null)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [dialogType, setDialogType] = useState<DialogType>(null)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [trialDays, setTrialDays] = useState('30')
    const [subscriptionMonths, setSubscriptionMonths] = useState('1')

    // Edit state
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editCuit, setEditCuit] = useState('')
    const [editTrialEndsAt, setEditTrialEndsAt] = useState('')
    const [editSubscriptionExpiresAt, setEditSubscriptionExpiresAt] = useState('')

    const handleToggle = async (userId: string) => {
        setLoading(userId)
        try {
            const res = await toggleUserStatus(userId)
            if (res.success) {
                toast.success('Estado actualizado')
                router.refresh()
            } else {
                toast.error(res.message || 'Error')
            }
        } catch (e) {
            toast.error('Error de conexión')
        } finally {
            setLoading(null)
        }
    }

    const openDialog = (user: User, type: DialogType) => {
        setSelectedUser(user)
        setDialogType(type)
        setDialogOpen(true)

        if (type === 'details') {
            setEditName(user.name || '')
            setEditEmail(user.email || '')
            setEditCuit(user.cuit || '')
            // Format dates for input type="date" (YYYY-MM-DD)
            setEditTrialEndsAt(user.trialEndsAt ? new Date(user.trialEndsAt).toISOString().split('T')[0] : '')
            setEditSubscriptionExpiresAt(user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt).toISOString().split('T')[0] : '')
        }
    }

    const handleUpdateProfile = async () => {
        if (!selectedUser) return
        setLoading(selectedUser.id)
        try {
            const res = await updateUserProfile(selectedUser.id, {
                name: editName,
                email: editEmail,
                cuit: editCuit,
                trialEndsAt: editTrialEndsAt || undefined,
                subscriptionExpiresAt: editSubscriptionExpiresAt || undefined
            })
            if (res.success) {
                toast.success('Perfil actualizado')
                router.refresh()
                closeDialog()
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error('Error al actualizar')
        } finally {
            setLoading(null)
        }
    }

    const closeDialog = () => {
        setDialogOpen(false)
        setSelectedUser(null)
        setDialogType(null)
        setTrialDays('30')
        setSubscriptionMonths('1')
    }

    // ... existing handlers ...
    const handleExtendTrial = async () => {
        if (!selectedUser) return
        setLoading(selectedUser.id)
        try {
            const days = parseInt(trialDays)
            if (isNaN(days) || days <= 0) {
                toast.error('Días inválidos')
                return
            }
            const res = await extendTrial(selectedUser.id, days)
            if (res.success) {
                toast.success(res.message)
                router.refresh()
                closeDialog()
            } else {
                toast.error(res.message)
            }
        } catch (e) {
            toast.error('Error al extender prueba')
        } finally {
            setLoading(null)
        }
    }

    const handleActivateSubscription = async () => {
        if (!selectedUser) return
        setLoading(selectedUser.id)
        try {
            const months = parseInt(subscriptionMonths)
            if (isNaN(months) || months <= 0) {
                toast.error('Meses inválidos')
                return
            }
            const res = await activateSubscription(selectedUser.id, months)
            if (res.success) {
                toast.success(res.message)
                router.refresh()
                closeDialog()
            } else {
                toast.error(res.message)
            }
        } catch (e) {
            toast.error('Error al activar suscripción')
        } finally {
            setLoading(null)
        }
    }

    const handleSuspend = async () => {
        if (!selectedUser) return
        setLoading(selectedUser.id)
        try {
            const res = await suspendSubscription(selectedUser.id)
            if (res.success) {
                toast.success(res.message)
                router.refresh()
                closeDialog()
            } else {
                toast.error(res.message)
            }
        } catch (e) {
            toast.error('Error al suspender')
        } finally {
            setLoading(null)
        }
    }

    const handleDeleteUser = async () => {
        if (!selectedUser) return
        setLoading(selectedUser.id)
        try {
            const res = await deleteUser(selectedUser.id)
            if (res.success) {
                toast.success('Usuario eliminado')
                router.refresh()
                closeDialog()
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error('Error al eliminar usuario')
        } finally {
            setLoading(null)
        }
    }

    const handleRoleChange = async (newRole: string) => {
        if (!selectedUser) return
        setLoading(selectedUser.id)
        try {
            const res = await updateUserRole(selectedUser.id, newRole)
            if (res.success) {
                toast.success('Rol actualizado')
                router.refresh()
                closeDialog()
            } else {
                toast.error(res.error)
            }
        } catch (e) {
            toast.error('Error al actualizar rol')
        } finally {
            setLoading(null)
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'trial':
                return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Prueba</Badge>
            case 'active':
                return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Activa</Badge>
            case 'suspended':
                return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Suspendida</Badge>
            case 'cancelled':
                return <Badge variant="destructive">Cancelada</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const formatDate = (date: Date | null) => {
        if (!date) return 'N/A'
        return new Date(date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const formatFullDate = (date: Date | null) => {
        if (!date) return 'Null'
        return new Date(date).toLocaleString('es-AR')
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Rol</TableHead>
                        <TableHead>Estado Cuenta</TableHead>
                        <TableHead>Suscripción</TableHead>
                        <TableHead>Expira</TableHead>
                        <TableHead>Estadísticas</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map(user => (
                        <TableRow key={user.id}>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{user.name || 'Sin Nombre'}</span>
                                    <span className="text-xs text-muted-foreground">{user.cuit || user.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                                    {user.role}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <Badge variant={user.isActive ? 'outline' : 'destructive'}>
                                    {user.isActive ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(user.subscriptionStatus)}
                            </TableCell>
                            <TableCell>
                                <span className="text-sm">
                                    {formatDate(user.subscriptionExpiresAt || user.trialEndsAt)}
                                </span>
                            </TableCell>
                            <TableCell>
                                <div className="text-xs space-y-1">
                                    <div>Clientes: {user.clientCount}</div>
                                    <div>Facturas: {user.invoiceCount}</div>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDialog(user, 'details')}
                                        title="Editar Usuario"
                                    >
                                        <Pencil className="h-4 w-4 text-gray-700" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDialog(user, 'extendTrial')}
                                        disabled={loading === user.id}
                                        title="Extender prueba"
                                    >
                                        <Clock className="h-4 w-4 text-blue-500" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDialog(user, 'activate')}
                                        disabled={loading === user.id}
                                        title="Activar suscripción"
                                    >
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openDialog(user, 'suspend')}
                                        disabled={loading === user.id}
                                        title="Suspender"
                                    >
                                        <PauseCircle className="h-4 w-4 text-orange-500" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleToggle(user.id)}
                                        disabled={loading === user.id}
                                        title={user.isActive ? 'Desactivar' : 'Activar'}
                                    >
                                        {loading === user.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : user.isActive ? (
                                            <PowerOff className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <Power className="h-4 w-4 text-gray-500" />
                                        )}
                                    </Button>
                                    {user.id !== currentUserId && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDialog(user, 'role')}
                                                disabled={loading === user.id}
                                                title="Cambiar Rol"
                                            >
                                                <Shield className="h-4 w-4 text-purple-500" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openDialog(user, 'delete')}
                                                disabled={loading === user.id}
                                                title="Eliminar Usuario"
                                            >
                                                <Trash2 className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {/* Existing Dialogs... */}
            <Dialog open={dialogOpen && dialogType === 'extendTrial'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Extender Período de Prueba</DialogTitle>
                        <DialogDescription>
                            Extender la prueba para {selectedUser?.name || 'este usuario'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="days">Días adicionales</Label>
                            <Input
                                id="days"
                                type="number"
                                min="1"
                                max="365"
                                value={trialDays}
                                onChange={(e) => setTrialDays(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                        <Button onClick={handleExtendTrial} disabled={!!loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Extender
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen && dialogType === 'activate'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Activar Suscripción</DialogTitle>
                        <DialogDescription>
                            Activar suscripción paga para {selectedUser?.name || 'este usuario'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="months">Meses de suscripción</Label>
                            <Input
                                id="months"
                                type="number"
                                min="1"
                                max="24"
                                value={subscriptionMonths}
                                onChange={(e) => setSubscriptionMonths(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                        <Button onClick={handleActivateSubscription} disabled={!!loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Activar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen && dialogType === 'suspend'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Suspender Suscripción</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de suspender la suscripción de {selectedUser?.name || 'este usuario'}?
                            El usuario no podrá acceder al sistema hasta que se reactive.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleSuspend} disabled={!!loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Suspender
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen && dialogType === 'delete'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar Usuario</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de eliminar a {selectedUser?.name || 'este usuario'}?
                            Esta acción es irreversible y eliminará todos sus datos.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleDeleteUser} disabled={!!loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Eliminar Definitivamente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={dialogOpen && dialogType === 'role'} onOpenChange={closeDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cambiar Rol de Usuario</DialogTitle>
                        <DialogDescription>
                            Cambiar el rol de {selectedUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Select onValueChange={handleRoleChange} defaultValue={selectedUser?.role}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar rol" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="USER">Usuario (USER)</SelectItem>
                                <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Details Dialog */}
            {/* Edit User Dialog */}
            <Dialog open={dialogOpen && dialogType === 'details'} onOpenChange={closeDialog}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar Usuario</DialogTitle>
                        <DialogDescription>
                            Modificar datos y fechas de {selectedUser?.name} ({selectedUser?.id})
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1 col-span-2">
                                <Label>ID</Label>
                                <div className="font-mono text-xs bg-muted p-1 rounded">{selectedUser?.id}</div>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="edit-name">Nombre</Label>
                                <Input
                                    id="edit-name"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    value={editEmail}
                                    onChange={(e) => setEditEmail(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-cuit">CUIT</Label>
                                <Input
                                    id="edit-cuit"
                                    value={editCuit}
                                    onChange={(e) => setEditCuit(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label>Rol</Label>
                                <div className="p-2 border rounded bg-gray-50 text-gray-500">{selectedUser?.role}</div>
                            </div>

                            <div className="col-span-2 h-px bg-gray-100 my-2" />

                            <div className="space-y-1">
                                <Label htmlFor="edit-trial">Fin Prueba (Trial)</Label>
                                <Input
                                    id="edit-trial"
                                    type="date"
                                    value={editTrialEndsAt}
                                    onChange={(e) => setEditTrialEndsAt(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">Original: {formatDate(selectedUser?.trialEndsAt)}</p>
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="edit-sub">Fin Suscripción</Label>
                                <Input
                                    id="edit-sub"
                                    type="date"
                                    value={editSubscriptionExpiresAt}
                                    onChange={(e) => setEditSubscriptionExpiresAt(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">Original: {formatDate(selectedUser?.subscriptionExpiresAt)}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Configuración (JSON) - Solo Lectura</Label>
                            <pre className="text-xs bg-slate-950 text-slate-50 p-4 rounded overflow-x-auto max-h-32">
                                {JSON.stringify(selectedUser?.config, null, 2)}
                            </pre>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancelar</Button>
                        <Button onClick={handleUpdateProfile} disabled={!!loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
