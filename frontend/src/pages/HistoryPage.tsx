import { useEffect, useMemo, useState } from 'react'
import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    LoaderCircle,
    Pencil,
    Plus,
    Save,
    Trash2,
    Utensils,
    X,
} from 'lucide-react'

import ConfirmDeleteModal from '../components/ConfirmDeleteModal'

import {
    createCookingSession,
    deleteCookingSession,
    getCookingCalendar,
    getCookingSessionsByDate,
    updateCookingSession,
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
    const [formDate, setFormDate] = useState(today)
    const [formTime, setFormTime] = useState(getCurrentVietnamTime())
    const [selectedDishIds, setSelectedDishIds] = useState<string[]>([])
    const [dishSearch, setDishSearch] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
    const [sessionToDelete, setSessionToDelete] = useState<CookingSession | null>(null)
    const [deleteError, setDeleteError] = useState<string | null>(null)

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

    const filteredDishes = useMemo(() => {
        const keyword = dishSearch.trim().toLocaleLowerCase('vi')

        return dishes.filter((dish) =>
            dish.name.toLocaleLowerCase('vi').includes(keyword),
        )
    }, [dishes, dishSearch])

    function changeMonth(amount: number) {
        const nextMonth = shiftMonth(month, amount)

        setMonth(nextMonth)
        setSelectedDate(`${nextMonth}-01`)
    }

    function openForm() {
        setEditingSessionId(null)
        setFormDate(today)
        setFormTime(getCurrentVietnamTime())
        setSelectedDishIds([])
        setDishSearch('')
        setFormError(null)
        setShowForm(true)
    }

    function openEditForm(session: CookingSession) {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(new Date(session.cooked_at))

        const values = Object.fromEntries(
            parts
                .filter((part) => part.type !== 'literal')
                .map((part) => [part.type, part.value]),
        ) as Record<string, string>

        setEditingSessionId(session.id)
        setFormDate(`${values.year}-${values.month}-${values.day}`)
        setFormTime(`${values.hour}:${values.minute}`)
        setSelectedDishIds(session.dishes.map((dish) => dish.id))
        setDishSearch('')
        setFormError(null)
        setShowForm(true)
    }

    function openDeleteModal(session: CookingSession) {
        setDeleteError(null)
        setSessionToDelete(session)
    }

    async function handleDeleteSession() {
        if (!sessionToDelete) return

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

    function toggleDish(dishId: string) {
        setSelectedDishIds((current) =>
            current.includes(dishId)
                ? current.filter((id) => id !== dishId)
                : [...current, dishId],
        )
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setFormError(null)

        if (selectedDishIds.length === 0) {
            setFormError('Vui lòng chọn ít nhất một món đã nấu.')
            return
        }

        if (!formDate || !formTime) {
            setFormError('Vui lòng chọn ngày và giờ nấu ăn.')
            return
        }

        try {
            setIsSubmitting(true)

            // Form nhập theo giờ Việt Nam, UTC+7.
            const cookedAt = `${formDate}T${formTime}:00+07:00`

            if (editingSessionId) {
                await updateCookingSession(editingSessionId, {
                    dishIds: selectedDishIds,
                    cookedAt,
                })
            } else {
                await createCookingSession({
                    dishIds: selectedDishIds,
                    cookedAt,
                })
            }

            setShowForm(false)
            setEditingSessionId(null)
            setSelectedDate(formDate)
            setMonth(formDate.slice(0, 7))
            setRefreshKey((current) => current + 1)
        } catch (err) {
            console.error('Failed to save cooking session:', err)

            setFormError(
                err instanceof Error
                    ? err.message
                    : 'Không thể lưu lịch sử nấu ăn. Vui lòng thử lại.',
            )
        } finally {
            setIsSubmitting(false)
        }
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
                                    aria-label={`${formatDate(date)}${dayDishes.length
                                        ? `, đã nấu: ${dayDishes.join(', ')}`
                                        : ''
                                        }`}
                                    className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-sm transition sm:min-h-16 ${isSelected
                                        ? 'bg-forest font-semibold text-white'
                                        : isToday
                                            ? 'border border-forest font-semibold text-forest'
                                            : 'text-ink hover:bg-sage/60'
                                        }`}
                                >
                                    <span>{Number(date.slice(-2))}</span>

                                    {dayDishes.length > 0 && (
                                        <span
                                            className={`size-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-forest'
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
                        <p className="mt-3 text-xs text-muted">Đang tải lịch...</p>
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
                                <LoaderCircle size={17} className="animate-spin" />
                                Đang tải lịch sử...
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="rounded-xl bg-cream px-4 py-8 text-center">
                                <CalendarDays size={25} className="mx-auto text-muted" />

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
                                        <Clock3 size={16} className="text-forest" />

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
                                                    <LoaderCircle size={16} className="animate-spin" />
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
                                                <span className="text-ink">{dish.name}</span>
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
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget && !isSubmitting) {
                            setShowForm(false)
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cooking-form-title"
                        className="my-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-cream p-5 shadow-xl sm:p-7"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="cooking-form-title"
                                    className="text-xl font-bold text-ink"
                                >
                                    {editingSessionId ? 'Sửa lịch sử nấu ăn' : 'Ghi nhận nấu ăn'}
                                </h2>

                                <p className="mt-1 text-sm text-muted">
                                    {editingSessionId
                                        ? 'Điều chỉnh ngày giờ và danh sách món đã nấu.'
                                        : 'Chọn những món thực tế đã được nấu.'}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                disabled={isSubmitting}
                                aria-label="Đóng form"
                                className="rounded-lg p-2 text-muted hover:bg-beige disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="cooked-date"
                                        className="block text-sm font-medium text-ink"
                                    >
                                        Ngày nấu
                                    </label>

                                    <input
                                        id="cooked-date"
                                        type="date"
                                        value={formDate}
                                        onChange={(event) => setFormDate(event.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="cooked-time"
                                        className="block text-sm font-medium text-ink"
                                    >
                                        Giờ nấu
                                    </label>

                                    <input
                                        id="cooked-time"
                                        type="time"
                                        value={formTime}
                                        onChange={(event) => setFormTime(event.target.value)}
                                        required
                                        disabled={isSubmitting}
                                        className="w-full rounded-xl border border-beige bg-white px-3 py-3 text-sm text-ink outline-none focus:border-forest disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="text-sm font-medium text-ink">
                                        Các món đã nấu
                                    </label>

                                    <span className="text-xs text-muted">
                                        Đã chọn {selectedDishIds.length} món
                                    </span>
                                </div>

                                <input
                                    type="search"
                                    value={dishSearch}
                                    onChange={(event) => setDishSearch(event.target.value)}
                                    placeholder="Tìm món trong kho..."
                                    aria-label="Tìm món trong kho"
                                    className="w-full rounded-xl border border-beige bg-white px-4 py-3 text-sm outline-none focus:border-forest"
                                />

                                <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-beige bg-white p-2">
                                    {filteredDishes.length === 0 ? (
                                        <p className="px-3 py-5 text-center text-sm text-muted">
                                            Không tìm thấy món ăn.
                                        </p>
                                    ) : (
                                        filteredDishes.map((dish) => {
                                            const checked = selectedDishIds.includes(dish.id)

                                            return (
                                                <label
                                                    key={dish.id}
                                                    className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 transition hover:bg-sage/40"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleDish(dish.id)}
                                                        disabled={isSubmitting}
                                                        className="size-4 accent-forest"
                                                    />

                                                    <span className="min-w-0 flex-1 text-sm text-ink">
                                                        {dish.name}
                                                    </span>

                                                    <span className="text-xs text-muted">
                                                        {dish.category}
                                                    </span>
                                                </label>
                                            )
                                        })
                                    )}
                                </div>
                            </div>

                            {formError && (
                                <p
                                    role="alert"
                                    className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                                >
                                    {formError}
                                </p>
                            )}

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    disabled={isSubmitting}
                                    className="rounded-xl border border-beige px-4 py-3 text-sm font-semibold text-ink hover:bg-beige disabled:opacity-50"
                                >
                                    Hủy
                                </button>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || dishes.length === 0}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-5 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <LoaderCircle size={17} className="animate-spin" />
                                    ) : (
                                        <Save size={17} />
                                    )}

                                    {isSubmitting
                                        ? 'Đang lưu...'
                                        : editingSessionId
                                            ? 'Lưu thay đổi'
                                            : 'Lưu lịch sử'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
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
