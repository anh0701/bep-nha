import { useEffect, useMemo, useState } from 'react'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    LoaderCircle,
    Pencil,
    Plus,
    Trash2,
    Utensils,
} from 'lucide-react'

import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import CookingSessionFormModal from '../components/CookingSessionFormModal'

import {
    deleteCookingSession,
    getCookingCalendar,
    getCookingSessionsByDate,
    updateCookingSession,
    createCookingSession,
} from '../services/cooking.service'

import { getDishes } from '../services/dish.service'

import type { CookingCalendarDay, CookingSession } from '../types/cooking'
import type { Dish } from '../types/dish'

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

function getVietnamDateParts() {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(new Date())

    return Object.fromEntries(
        parts
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    ) as Record<string, string>
}

function getTodayInVietnam() {
    const parts = getVietnamDateParts()
    return `${parts.year}-${parts.month}-${parts.day}`
}

function getCurrentVietnamTime() {
    const parts = getVietnamDateParts()
    return `${parts.hour}:${parts.minute}`
}

function formatDate(date: string) {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
}

function formatTime(date: string) {
    return new Intl.DateTimeFormat('vi-VN', {
        timeZone: TIME_ZONE,
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(new Date(date))
}

function formatMonth(month: string) {
    const [year, monthNumber] = month.split('-').map(Number)

    return new Intl.DateTimeFormat('vi-VN', {
        month: 'long',
        year: 'numeric',
        timeZone: TIME_ZONE,
    }).format(new Date(Date.UTC(year, monthNumber - 1, 1, 12)))
}

function shiftMonth(month: string, amount: number) {
    const [year, monthNumber] = month.split('-').map(Number)
    const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1))

    return [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
    ].join('-')
}

function getCalendarCells(month: string) {
    const [year, monthNumber] = month.split('-').map(Number)
    const firstDay = new Date(Date.UTC(year, monthNumber - 1, 1))
    const daysInMonth = new Date(
        Date.UTC(year, monthNumber, 0),
    ).getUTCDate()

    // Lịch bắt đầu từ thứ Hai.
    const offset = (firstDay.getUTCDay() + 6) % 7

    return [
        ...Array.from({ length: offset }, () => null),
        ...Array.from({ length: daysInMonth }, (_, index) => {
            const day = String(index + 1).padStart(2, '0')
            return `${month}-${day}`
        }),
    ]
}

function getVietnamDate(date: string) {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(date))

    const values = Object.fromEntries(
        parts
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
    ) as Record<string, string>

    return `${values.year}-${values.month}-${values.day}`
}

export default function HistoryPage() {
    const today = getTodayInVietnam()

    const [month, setMonth] = useState(today.slice(0, 7))
    const [selectedDate, setSelectedDate] = useState(today)

    const [calendarDays, setCalendarDays] = useState<CookingCalendarDay[]>([])
    const [sessions, setSessions] = useState<CookingSession[]>([])
    const [dishes, setDishes] = useState<Dish[]>([])

    const [loadingCalendar, setLoadingCalendar] = useState(true)
    const [loadingSessions, setLoadingSessions] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [showForm, setShowForm] = useState(false)
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)

    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
    const [sessionToDelete, setSessionToDelete] = useState<CookingSession | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

    const [refreshKey, setRefreshKey] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function loadCalendar() {
            try {
                setLoadingCalendar(true)
                setError(null)

                const data = await getCookingCalendar(month)

                if (!cancelled) {
                    setCalendarDays(data)
                }
            } catch (err) {
                console.error('Failed to load cooking calendar:', err)

                if (!cancelled) {
                    setError('Không thể tải lịch sử nấu ăn. Vui lòng thử lại.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingCalendar(false)
                }
            }
        }

        void loadCalendar()

        return () => {
            cancelled = true
        }
    }, [month, refreshKey])

    useEffect(() => {
        let cancelled = false

        async function loadSessions() {
            try {
                setLoadingSessions(true)
                setError(null)

                const data = await getCookingSessionsByDate(selectedDate)

                if (!cancelled) {
                    setSessions(data)
                }
            } catch (err) {
                console.error('Failed to load cooking sessions:', err)

                if (!cancelled) {
                    setSessions([])
                    setError('Không thể tải các phiên nấu ăn của ngày này.')
                }
            } finally {
                if (!cancelled) {
                    setLoadingSessions(false)
                }
            }
        }

        void loadSessions()

        return () => {
            cancelled = true
        }
    }, [selectedDate, refreshKey])

    useEffect(() => {
        let cancelled = false

        async function loadDishes() {
            try {
                const result = await getDishes()

                if (!cancelled) {
                    setDishes(result.data.filter((dish) => dish.is_active))
                }
            } catch (err) {
                console.error('Failed to load dishes:', err)
            }
        }

        void loadDishes()

        return () => {
            cancelled = true
        }
    }, [])

    const calendarCells = useMemo(
        () => getCalendarCells(month),
        [month],
    )

    const dishesByDate = useMemo(
        () => new Map(calendarDays.map((day) => [day.cooked_on, day.dishes])),
        [calendarDays],
    )

    const editingSession = useMemo(
        () =>
            editingSessionId
                ? sessions.find((session) => session.id === editingSessionId) ?? null
                : null,
        [editingSessionId, sessions],
    )

    function changeMonth(amount: number) {
        const nextMonth = shiftMonth(month, amount)

        setMonth(nextMonth)
        setSelectedDate(`${nextMonth}-01`)
    }

    function openForm() {
        setEditingSessionId(null)
        setShowForm(true)
    }

    function openEditForm(session: CookingSession) {
        setEditingSessionId(session.id)
        setShowForm(true)
    }

    function openDeleteModal(session: CookingSession) {
        setDeleteError(null)
        setSessionToDelete(session)
    }

    async function handleDeleteSession() {
        if (!sessionToDelete || deletingSessionId !== null) return

        try {
            setDeletingSessionId(sessionToDelete.id)
            setDeleteError(null)

            await deleteCookingSession(sessionToDelete.id)

            setSessionToDelete(null)
            setRefreshKey((current) => current + 1)
        } catch (err) {
            console.error('Failed to delete cooking session:', err)

            setDeleteError(
                err instanceof Error
                    ? err.message
                    : 'Không thể xóa lịch sử nấu ăn. Vui lòng thử lại.',
            )
        } finally {
            setDeletingSessionId(null)
        }
    }

    async function handleCookingFormSubmit(data: {
        date: string
        time: string
        dishIds: string[]
    }) {
        // Form nhập theo giờ Việt Nam, UTC+7.
        const cookedAt = `${data.date}T${data.time}:00+07:00`

        if (new Date(cookedAt).getTime() > Date.now()) {
            throw new Error('Thời gian nấu không thể ở tương lai.')
        }

        if (editingSessionId) {
            await updateCookingSession(editingSessionId, {
                dishIds: data.dishIds,
                cookedAt,
            })
        } else {
            await createCookingSession({
                dishIds: data.dishIds,
                cookedAt,
            })
        }

        setShowForm(false)
        setEditingSessionId(null)
        setSelectedDate(data.date)
        setMonth(data.date.slice(0, 7))
        setRefreshKey((current) => current + 1)
    }

    return (
        <div className="mx-auto max-w-6xl space-y-7 px-5 py-7 md:px-10 md:py-10">
            <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted">
                        <CalendarDays size={17} />
                        Không gian bếp
                    </div>

                    <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink">
                        Lịch sử nấu ăn
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted">
                        Ghi lại những bữa cơm đã nấu và xem lại từng ngày.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openForm}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-3 text-sm font-semibold text-white transition hover:bg-forest/90"
                >
                    <Plus size={18} />
                    Ghi nhận nấu ăn
                </button>
            </section>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                    {error}
                </div>
            )}

            <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                <div className="rounded-2xl border border-beige bg-white p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => changeMonth(-1)}
                            aria-label="Tháng trước"
                            className="rounded-xl p-2 text-muted transition hover:bg-sage/60 hover:text-forest"
                        >
                            <ChevronLeft size={20} />
                        </button>

                        <h2 className="text-lg font-bold capitalize text-ink">
                            {formatMonth(month)}
                        </h2>

                        <button
                            type="button"
                            onClick={() => changeMonth(1)}
                            aria-label="Tháng sau"
                            className="rounded-xl p-2 text-muted transition hover:bg-sage/60 hover:text-forest"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    <div className="mt-5 grid grid-cols-7 gap-1 text-center">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((day) => (
                            <div
                                key={day}
                                className="py-2 text-xs font-semibold text-muted"
                            >
                                {day}
                            </div>
                        ))}

                        {calendarCells.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} />
                            }

                            const dayDishes = dishesByDate.get(date) ?? []
                            const isSelected = selectedDate === date
                            const isToday = today === date

                            return (
                                <button
                                    key={date}
                                    type="button"
                                    onClick={() => setSelectedDate(date)}
                                    aria-pressed={isSelected}
                                    aria-label={`${formatDate(date)}${
                                        dayDishes.length
                                            ? `, đã nấu: ${dayDishes.join(', ')}`
                                            : ''
                                    }`}
                                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-sm transition sm:min-h-16 ${
                                        isSelected
                                            ? 'bg-forest font-semibold text-white'
                                            : isToday
                                              ? 'border border-forest font-semibold text-forest'
                                              : 'text-ink hover:bg-sage/60'
                                    }`}
                                >
                                    <span>{Number(date.slice(-2))}</span>

                                    {dayDishes.length > 0 && (
                                        <span
                                            className={`size-1.5 rounded-full ${
                                                isSelected ? 'bg-white' : 'bg-forest'
                                            }`}
                                        />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-muted">
                        <span className="size-2 rounded-full bg-forest" />
                        Ngày có lịch sử nấu ăn
                    </div>

                    {loadingCalendar && (
                        <p className="mt-3 text-xs text-muted">
                            Đang tải lịch...
                        </p>
                    )}
                </div>

                <div className="rounded-2xl border border-beige bg-white p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm text-muted">Chi tiết ngày</p>
                            <h2 className="mt-1 text-xl font-bold text-ink">
                                {formatDate(selectedDate)}
                            </h2>
                        </div>

                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sage/60 text-forest">
                            <Utensils size={20} />
                        </div>
                    </div>

                    <div className="mt-5 space-y-4">
                        {loadingSessions ? (
                            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted">
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                                Đang tải lịch sử...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="rounded-xl bg-cream px-4 py-8 text-center">
                                <CalendarDays
                                    size={25}
                                    className="mx-auto text-muted"
                                />

                                <p className="mt-3 text-sm font-medium text-ink">
                                    Chưa có lịch sử nấu ăn
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted">
                                    Những món bạn ghi nhận sẽ xuất hiện tại đây.
                                </p>
                            </div>
                        ) : (
                            sessions.map((session, index) => (
                                <article
                                    key={session.id}
                                    className="rounded-xl border border-beige/80 p-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <Clock3
                                            size={16}
                                            className="text-forest"
                                        />

                                        <h3 className="text-sm font-semibold text-ink">
                                            Phiên nấu ăn {sessions.length - index}
                                        </h3>

                                        <div className="ml-auto flex shrink-0 items-center gap-1">
                                            <span className="mr-1 text-sm font-semibold text-forest">
                                                {formatTime(session.cooked_at)}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => openEditForm(session)}
                                                aria-label="Sửa phiên nấu"
                                                title="Sửa phiên nấu"
                                                className="rounded-lg p-2 text-muted transition hover:bg-sage/60 hover:text-forest"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(session)}
                                                disabled={deletingSessionId !== null}
                                                aria-label="Xóa phiên nấu"
                                                title="Xóa phiên nấu"
                                                className="rounded-lg p-2 text-muted transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {deletingSessionId === session.id ? (
                                                    <LoaderCircle
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <ul className="mt-3 space-y-2">
                                        {session.dishes.map((dish) => (
                                            <li
                                                key={dish.id}
                                                className="flex items-start justify-between gap-3 text-sm"
                                            >
                                                <span className="text-ink">
                                                    {dish.name}
                                                </span>

                                                <span className="shrink-0 text-xs text-muted">
                                                    {dish.category}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))
                        )}
                    </div>
                </div>
            </section>

            {showForm && (
                <CookingSessionFormModal
                    key={editingSessionId ?? 'new-session'}
                    dishes={dishes}
                    session={editingSession}
                    initialDate={
                        editingSession
                            ? getVietnamDate(editingSession.cooked_at)
                            : today
                    }
                    initialTime={
                        editingSession
                            ? formatTime(editingSession.cooked_at)
                            : getCurrentVietnamTime()
                    }
                    onClose={() => {
                        setShowForm(false)
                        setEditingSessionId(null)
                    }}
                    onSubmit={handleCookingFormSubmit}
                />
            )}

            {sessionToDelete && (
                <ConfirmDeleteModal
                    title="Xóa lịch sử nấu ăn?"
                    description={
                        <>
                            Bạn có chắc muốn xóa phiên nấu lúc{' '}
                            <span className="font-semibold text-ink">
                                {formatTime(sessionToDelete.cooked_at)}
                            </span>{' '}
                            ngày{' '}
                            <span className="font-semibold text-ink">
                                {formatDate(getVietnamDate(sessionToDelete.cooked_at))}
                            </span>
                            ?
                        </>
                    }
                    confirmLabel="Xóa lịch sử"
                    isLoading={deletingSessionId !== null}
                    error={deleteError}
                    icon={<Trash2 size={24} strokeWidth={2} />}
                    onCancel={() => {
                        if (deletingSessionId !== null) return

                        setSessionToDelete(null)
                        setDeleteError(null)
                    }}
                    onConfirm={() => void handleDeleteSession()}
                >
                    <div className="mt-4 rounded-xl border border-beige bg-white p-3">
                        <p className="text-xs font-medium text-muted">
                            Các món trong phiên
                        </p>

                        <ul className="mt-2 space-y-2">
                            {sessionToDelete.dishes.map((dish) => (
                                <li
                                    key={dish.id}
                                    className="flex items-center justify-between gap-3 text-sm"
                                >
                                    <span className="text-ink">{dish.name}</span>
                                    <span className="shrink-0 text-xs text-muted">
                                        {dish.category}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-muted">
                        Lịch sử này sẽ bị xóa vĩnh viễn. Những lần nấu khác của cùng
                        món sẽ không bị ảnh hưởng.
                    </p>
                </ConfirmDeleteModal>
            )}
        </div>
    )
}
