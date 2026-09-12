import type { Member, PresenceStatus } from '../types'
import { colorForId, initials } from '../lib/format'
import { useAuth } from '../context/AuthContext'

const STATUS_LABEL: Record<PresenceStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  dnd: 'Do not disturb',
  offline: 'Offline',
}

export function MemberList({
  members,
  onStatus,
}: {
  members: Member[]
  onStatus: (status: PresenceStatus) => void
}) {
  const { user, logout } = useAuth()
  const online = members.filter((m) => m.status !== 'offline')
  const offline = members.filter((m) => m.status === 'offline')
  const selfStatus =
    members.find((m) => m.id === user?.id)?.status || user?.status || 'online'

  return (
    <aside className="member-list">
      <div className="member-section">
        <div className="member-heading">Online — {online.length}</div>
        {online.map((m) => (
          <MemberRow key={m.id} member={m} />
        ))}
      </div>
      {offline.length > 0 && (
        <div className="member-section">
          <div className="member-heading">Offline — {offline.length}</div>
          {offline.map((m) => (
            <MemberRow key={m.id} member={m} dim />
          ))}
        </div>
      )}

      <div className="self-bar">
        {user && (
          <>
            <div className="self-identity">
              <Avatar name={user.displayName} id={user.id} status={selfStatus} />
              <div>
                <div className="self-name">{user.displayName}</div>
                <div className="self-user">@{user.username}</div>
              </div>
            </div>
            <div className="self-actions">
              <select
                aria-label="Status"
                value={selfStatus === 'offline' ? 'online' : selfStatus}
                onChange={(e) => onStatus(e.target.value as PresenceStatus)}
              >
                <option value="online">Online</option>
                <option value="idle">Idle</option>
                <option value="dnd">DND</option>
              </select>
              <button type="button" onClick={logout} className="ghost-btn">
                Leave
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

function MemberRow({ member, dim }: { member: Member; dim?: boolean }) {
  return (
    <div className={`member-row ${dim ? 'dim' : ''}`} title={STATUS_LABEL[member.status]}>
      <Avatar name={member.displayName} id={member.id} status={member.status} />
      <div className="member-meta">
        <span className="member-name">{member.displayName}</span>
        <span className="member-status">{STATUS_LABEL[member.status]}</span>
      </div>
    </div>
  )
}

export function Avatar({
  name,
  id,
  status,
  size = 32,
}: {
  name: string
  id: string
  status?: PresenceStatus
  size?: number
}) {
  return (
    <div className="avatar-wrap" style={{ width: size, height: size }}>
      <div
        className="avatar"
        style={{
          background: colorForId(id),
          width: size,
          height: size,
          fontSize: size * 0.34,
        }}
      >
        {initials(name)}
      </div>
      {status && <span className={`presence presence-${status}`} />}
    </div>
  )
}
