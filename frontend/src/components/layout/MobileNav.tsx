import { NavLink } from 'react-router'
import { navigation } from '../../config/navigation'

export default function MobileNav() {
    return (

        <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-beige bg-cream/95 px-1 py-2 backdrop-blur md:hidden">
            {navigation.map(({ label, path, icon: Icon }) => (
                <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    className={({ isActive }) =>
                        `flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[10px] ${isActive ? 'font-semibold text-forest' : 'text-muted'
                        }`
                    }
                >
                    <Icon size={19} />
                    <span>{label === 'Random món ăn' ? 'Random' : label}</span>
                </NavLink>
            ))}
        </nav>

    )
}
