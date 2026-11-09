// Iconos de Lucide que registra el sitio, como lo haría una aplicación: cadenas completas de
// lucide-static con `createIcons` (docs/contract/icons.md). Los ejemplos vivos los usan por nombre
// en kebab-case (<g-icon name="arrow-right">). La lista de la librería (plus, x, check…) no hace falta.
import {
  Activity, Archive, ArrowLeft, ArrowRight, Bell, Bookmark, Briefcase, Building2, BuildingComplex,
  Calendar, ChartColumn, ChartLine, CircleUser, Clock, Code, Coffee, CreditCard, Download, Eye,
  FileText, Filter, Flag, Folder, Globe, Heart, Hospital, House, Image, Inbox, LayoutDashboard,
  Leaf, Lock, LockOpen, LogOut, Mail, MapPin, Music, Package, Palette, Pencil, Phone, Pill, Printer,
  Rocket, Save, Send, Settings, Share2, ShoppingCart, Sparkles, Star, Stethoscope, Tag, Truck,
  Upload, Users, Wallet, Zap,
  // los que registran los bancos de @grana/blocks (appIcons)
  Baby, CalendarPlus, CalendarX, MessageCircle, Navigation, PawPrint, Wifi,
  Hand,
  // los del marco calcado (Layout.vue, sitio-marco.md §3): tema, idioma, búsqueda, «Menú» y las teclas del pie de la búsqueda.
  // «Menú» lleva text-align-start: en lucide-static 1.x la exportación AlignLeft ya pinta ese icono y se registra con
  // ese nombre, así que `align-left` no existía (aviso de GIcon en todas las páginas).
  Sun, Moon, Languages, Menu, Search, TextAlignStart, ChevronDown, ArrowUp, ArrowDown, CornerDownLeft
} from 'lucide-static'

export const siteIcons = [
  Activity, Archive, ArrowLeft, ArrowRight, Bell, Bookmark, Briefcase, Building2, BuildingComplex,
  Calendar, ChartColumn, ChartLine, CircleUser, Clock, Code, Coffee, CreditCard, Download, Eye,
  FileText, Filter, Flag, Folder, Globe, Heart, Hospital, House, Image, Inbox, LayoutDashboard,
  Leaf, Lock, LockOpen, LogOut, Mail, MapPin, Music, Package, Palette, Pencil, Phone, Pill, Printer,
  Rocket, Save, Send, Settings, Share2, ShoppingCart, Sparkles, Star, Stethoscope, Tag, Truck,
  Upload, Users, Wallet, Zap,
  Baby, CalendarPlus, CalendarX, MessageCircle, Navigation, PawPrint, Wifi,
  Hand,
  Sun, Moon, Languages, Menu, Search, TextAlignStart, ChevronDown, ArrowUp, ArrowDown, CornerDownLeft
]
