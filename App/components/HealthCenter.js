import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal, TextInput, Alert, Platform, Switch } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import MapView, { Marker } from 'react-native-maps';
import ScreenWrapper from './ScreenWrapper';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, PawPrint, Clock, AlertCircle, CheckCircle, XCircle, X, MapPin, FileText, Edit2, Save, ChevronRight } from 'lucide-react-native';

const HealthCenter = () => {
    const [pets, setPets] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [eventCounts, setEventCounts] = useState({
        pendiente: 0,
        completado: 0,
        cancelado: 0,
        vencido: 0
    });
    const [mapModalVisible, setMapModalVisible] = useState(false);
    const [mapRegion, setMapRegion] = useState({
        latitude: -31.4201,
        longitude: -64.1888,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
    });
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [selectedPetForCreate, setSelectedPetForCreate] = useState(null);
    const [createForm, setCreateForm] = useState({
        titulo: '',
        categoria: '',
        descripcion: '',
        fecha: '',
        hora: '',
        lat: '',
        lon: '',
        estado: 'pendiente'
    });
    const [creating, setCreating] = useState(false);
    const [isMapForCreate, setIsMapForCreate] = useState(false);
    const [categories, setCategories] = useState([]);
    const [estados, setEstados] = useState([]);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [editForm, setEditForm] = useState({
        titulo: '',
        categoria: '',
        descripcion: '',
        fecha: '',
        hora: '',
        lat: '',
        lon: '',
        estado: ''
    });
    const [saving, setSaving] = useState(false);
    const [updatingEventStatus, setUpdatingEventStatus] = useState({});

    // estados para modal de eventos por mascota
    const [petEventsModalVisible, setPetEventsModalVisible] = useState(false);
    const [selectedPetForEvents, setSelectedPetForEvents] = useState(null); // null = todos los eventos, objeto = eventos de esa mascota
    const [selectedEstadoFilter, setSelectedEstadoFilter] = useState(null); // filtro por estado: null = sin filtro, string = filtrar por ese estado

    const renderCategorySelector = (selectedValue, onSelect) => {
        if (!Array.isArray(categories) || categories.length === 0) {
            return <Text style={styles.emptyText}>No hay categorías disponibles.</Text>;
        }

        return (
            <View style={styles.categoryGroups}>
                {categories.map((group) => (
                    <View key={group.key ?? group.label} style={styles.categoryGroup}>
                        <Text style={styles.categoryGroupTitle}>{group.label}</Text>
                        <View style={styles.categoryItemsRow}>
                            {(group.items || []).map((item) => {
                                const selected = selectedValue === item.value;
                                return (
                                    <TouchableOpacity
                                        key={item.value}
                                        style={[styles.categoryChip, selected && styles.categoryChipSelected]}
                                        onPress={() => onSelect(item.value)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>
                                            {item.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    useEffect(() => {
        fetchData();
        fetchCategories();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setError('No se encontró token de autenticación');
                setLoading(false);
                return;
            }

            await Promise.all([
                fetchPets(token),
                fetchEvents(token),
                fetchEventCounts(token),
                fetchCategories(),
                fetchEstados()
            ]);
        } catch (err) {
            console.error('Error al cargar datos:', err);
            setError('Error al cargar los datos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const fetchPets = async (token) => {
        const response = await fetch(API_ENDPOINTS.PETS, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al obtener las mascotas');
        const data = await response.json();
        setPets(data.mascotas || []);
    };

    const fetchEvents = async (token) => {
        const response = await fetch(`${API_ENDPOINTS.EVENTS}?offset=0&limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al obtener los eventos');
        const data = await response.json();
        const items = data.items || [];

        // ordenar por urgencia: próximos/pendientes primero, vencidos después, completados al final
        const urgencyMap = {
            'pendiente': 4,
            'proximo': 3,
            'vencido': 2,
            'completado': 1
        };

        const sortedEvents = items.sort((a, b) => {
            const urgencyA = urgencyMap[a.estado.toLowerCase()] || 0;
            const urgencyB = urgencyMap[b.estado.toLowerCase()] || 0;
            return urgencyB - urgencyA;
        });

        setEvents(sortedEvents);
    };

    const fetchEventCounts = async (token) => {
        const response = await fetch(`${API_ENDPOINTS.EVENTS}/contar-por-estado`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Error al obtener el conteo de eventos');
        const data = await response.json();
        setEventCounts(data);
    };

    const fetchCategories = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_ENDPOINTS.EVENTS}/categorias`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Error al obtener categorías');
            const data = await response.json();
            setCategories(data);
        } catch (err) {
            console.error('Error cargando categorías:', err);
        }
    };

    const fetchEstados = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${API_ENDPOINTS.EVENTS}/estados`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!response.ok) throw new Error('Error al obtener estados');
            const data = await response.json();
            setEstados(data);
        } catch (err) {
            console.error('Error cargando estados:', err);
        }
    };

    // detectar si la fecha del formulario es pasada
    const isCreateFormDatePast = () => {
        if (!createForm.fecha || !createForm.hora) return false;
        const eventDateTime = new Date(`${createForm.fecha}T${createForm.hora}`);
        return eventDateTime < new Date();
    };

    // obtener estados disponibles según si es pasada o futura
    const getAvailableEstados = () => {
        if (!Array.isArray(estados) || estados.length === 0) return [];

        if (isCreateFormDatePast()) {
            // evento pasado: solo completado, vencido, cancelado
            return estados.filter(e => ['completado', 'vencido', 'cancelado'].includes(e.value));
        }
        // evento futuro: todos los estados
        return estados;
    };

    // Agrupa eventos por mascota
    const groupEventsByPet = () => {
        const grouped = {};

        pets.forEach(pet => {
            grouped[pet.mascota_id] = {
                pet: pet,
                events: []
            };
        });

        events.forEach(event => {
            const petId = event.mascota?.mascota_id;
            if (petId && grouped[petId]) {
                grouped[petId].events.push(event);
            }
        });

        return Object.values(grouped);
    };

    const calculateAge = (birthDateString) => {
        if (!birthDateString) return 'Edad desconocida';
        const birthDate = new Date(birthDateString);
        const today = new Date();
        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
            years--;
            months += 12;
        }
        if (years > 0) return `${years} año${years !== 1 ? 's' : ''}`;
        return `${months} mes${months !== 1 ? 'es' : ''}`;
    };

    const getDaysRemaining = (dateString) => {
        const eventDate = new Date(dateString);
        const today = new Date();

        // Resetear horas para comparar solo fechas
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate < today) return null;

        const diffTime = Math.abs(eventDate - today);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        return `${diffDays} día${diffDays !== 1 ? 's' : ''} restantes`;
    };

    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'completado': return '#10b981'; // Green
            case 'vencido': return '#ef4444'; // Red
            case 'pendiente': return '#f59e0b'; // Amber
            case 'proximo': return '#3b82f6'; // Blue
            default: return '#6b7280'; // Gray
        }
    };

    // formatear categoría usando el mapeo del backend
    const formatCategoria = (categoria) => {
        if (!categoria || !Array.isArray(categories)) return categoria;

        // buscar en todos los grupos de categorías
        for (const grupo of categories) {
            if (!grupo.items) continue;
            const found = grupo.items.find(item => item.value === categoria);
            if (found) return found.label;
        }

        // si no se encuentra, retornar el valor original capitalizado
        return categoria.split('_').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    };

    // formatear estado para mostrar en UI usando datos del backend
    const formatEstado = (estado) => {
        if (!Array.isArray(estados) || estados.length === 0) {
            // fallback si aún no se cargaron los estados
            return estado?.charAt(0).toUpperCase() + estado?.slice(1) || estado;
        }

        const found = estados.find(e => e.value === estado?.toLowerCase());
        return found ? found.label : (estado?.charAt(0).toUpperCase() + estado?.slice(1) || estado);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const renderPetCard = (item) => (
        <TouchableOpacity
            key={item.mascota_id}
            style={styles.card}
            onPress={() => {
                // filtrar eventos de esta mascota
                const petEvents = events.filter(e => e.mascota?.mascota_id === item.mascota_id);
                setSelectedPetForEvents({ ...item, events: petEvents });
                setPetEventsModalVisible(true);
            }}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.iconContainer}>
                    <PawPrint size={24} color="#5bbbe8" />
                </View>
                <View style={styles.headerText}>
                    <Text style={styles.petName}>{item.nombre}</Text>
                    <Text style={styles.petSpecies}>{item.especie}</Text>
                </View>
            </View>
            <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                    <Calendar size={16} color="#6b7280" />
                    <Text style={styles.infoText}>{calculateAge(item.fecha_nacimiento)}</Text>
                </View>
                {item.descripcion && (
                    <Text style={styles.description}>{item.descripcion}</Text>
                )}
                <TouchableOpacity
                    style={styles.addEventButton}
                    onPress={(e) => {
                        e.stopPropagation(); // evitar que abra el modal
                        handleOpenCreateModal(item);
                    }}
                >
                    <Text style={styles.addEventButtonText}>+ Añadir Evento</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );

    const isEventEditable = (event) => {
        const eventDate = new Date(event.fecha);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate >= today;
    };

    const handleEventPress = (event) => {
        setSelectedEvent(event);
        setModalVisible(true);
        setIsEditMode(false);
        // Extraer fecha y hora del campo fecha del evento
        const eventDate = new Date(event.fecha);
        const dateStr = eventDate.toISOString().split('T')[0];
        const timeStr = event.hora || eventDate.toTimeString().split(' ')[0].substring(0, 5);

        setEditForm({
            titulo: event.titulo || '',
            categoria: event.categoria || '',
            descripcion: event.descripcion || '',
            fecha: dateStr,
            hora: timeStr,
            lat: event.ubicacion_clinica_lat?.toString() || '',
            lon: event.ubicacion_clinica_lon?.toString() || '',
            estado: event.estado || ''
        });
    };

    const handleEditToggle = () => {
        if (!isEventEditable(selectedEvent)) {
            Alert.alert(
                'No se puede editar',
                'Solo puedes editar eventos con fecha actual o futura.'
            );
            return;
        }
        setIsEditMode(!isEditMode);
    };

    const handleOpenMapModal = () => {
        const lat = parseFloat(editForm.lat) || -31.4201;
        const lon = parseFloat(editForm.lon) || -64.1888;
        setMapRegion({
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        setMapModalVisible(true);
    };

    const handleMapRegionChange = (region) => {
        setMapRegion(region);
    };

    const handleConfirmLocation = () => {
        if (isMapForCreate) {
            setCreateForm({
                ...createForm,
                lat: mapRegion.latitude.toFixed(6),
                lon: mapRegion.longitude.toFixed(6)
            });
        } else {
            setEditForm({
                ...editForm,
                lat: mapRegion.latitude.toFixed(6),
                lon: mapRegion.longitude.toFixed(6)
            });
        }
        setMapModalVisible(false);
        setIsMapForCreate(false);
    };

    const formatDateForDisplay = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const formatDateForAPI = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
            setCreateForm({
                ...createForm,
                fecha: formatDateForAPI(date)
            });
        }
    };

    const handleOpenCreateModal = (pet) => {
        setSelectedPetForCreate(pet);
        const today = new Date();
        setSelectedDate(today);
        setCreateForm({
            titulo: '',
            categoria: '',
            descripcion: '',
            fecha: formatDateForAPI(today),
            hora: '',
            lat: '',
            lon: ''
        });
        setCreateModalVisible(true);
    };

    const handleOpenMapForCreate = () => {
        const lat = parseFloat(createForm.lat) || -31.4201;
        const lon = parseFloat(createForm.lon) || -64.1888;
        setMapRegion({
            latitude: lat,
            longitude: lon,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
        });
        setIsMapForCreate(true);
        setMapModalVisible(true);
    };

    const handleCreateEvent = async () => {
        try {
            // Validaciones
            if (!createForm.titulo.trim()) {
                Alert.alert('Error', 'El título es obligatorio');
                return;
            }
            if (!createForm.categoria.trim()) {
                Alert.alert('Error', 'La categoría es obligatoria');
                return;
            }
            if (!createForm.fecha) {
                Alert.alert('Error', 'La fecha es obligatoria');
                return;
            }
            if (!createForm.hora) {
                Alert.alert('Error', 'La hora es obligatoria');
                return;
            }

            setCreating(true);
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                setCreating(false);
                Alert.alert('Error', 'No se encontró token de autenticación');
                return;
            }

            const body = {
                categoria: createForm.categoria.trim(),
                fecha: createForm.fecha,
                hora: createForm.hora,
                titulo: createForm.titulo.trim(),
                descripcion: createForm.descripcion.trim() || undefined,
                estado: createForm.estado, // incluir estado seleccionado
                lat: createForm.lat ? parseFloat(createForm.lat) : null,
                lon: createForm.lon ? parseFloat(createForm.lon) : null
            };

            const response = await fetch(`${API_ENDPOINTS.PETS}/${selectedPetForCreate.mascota_id}/historial`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear el evento');
            }

            setCreating(false);
            setCreateModalVisible(false);

            // Mostrar alert después de cerrar el modal
            setTimeout(() => {
                Alert.alert('Éxito', 'Evento creado correctamente');
            }, 100);

            await fetchData();
        } catch (err) {
            console.error('Error al crear evento:', err);
            setCreating(false);
            Alert.alert('Error', err.message || 'No se pudo crear el evento');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = await AsyncStorage.getItem('token');

            if (!token) {
                setSaving(false);
                Alert.alert('Error', 'No se encontró token de autenticación');
                return;
            }

            if (!editForm.fecha || !editForm.hora) {
                setSaving(false);
                Alert.alert('Error', 'La fecha y la hora son obligatorias para actualizar el evento');
                return;
            }

            // Actualizar información del evento
            const eventUpdateBody = {
                fecha: editForm.fecha,
                categoria: editForm.categoria,
                hora: editForm.hora,
                titulo: editForm.titulo,
                descripcion: editForm.descripcion,
                estado: editForm.estado,
                lat: parseFloat(editForm.lat),
                lon: parseFloat(editForm.lon)
            };

            const eventResponse = await fetch(`${API_ENDPOINTS.EVENTS}/${selectedEvent.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventUpdateBody)
            });

            if (!eventResponse.ok) {
                const errorData = await eventResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al actualizar el evento');
            }

            setSaving(false);
            setIsEditMode(false);
            setModalVisible(false);

            // Mostrar alert después de cerrar el modal
            setTimeout(() => {
                Alert.alert('Éxito', 'Evento actualizado correctamente');
            }, 100);

            await fetchData();
        } catch (err) {
            console.error('Error al actualizar evento:', err);
            setSaving(false);
            Alert.alert('Error', err.message || 'No se pudo actualizar el evento');
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Eliminar Evento',
            '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const token = await AsyncStorage.getItem('token');
                            if (!token) throw new Error('No autorizado');

                            const response = await fetch(`${API_ENDPOINTS.EVENTS}/${selectedEvent.id}`, {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${token}`,
                                },
                            });

                            if (!response.ok) throw new Error('Error al eliminar el evento');

                            setModalVisible(false);
                            setIsEditMode(false);

                            setTimeout(() => {
                                Alert.alert('Éxito', 'Evento eliminado correctamente');
                            }, 100);

                            await fetchData();
                        } catch (error) {
                            Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
                        }
                    }
                }
            ]
        );
    };

    const handleToggleCompleted = async (eventItem, nextValue) => {
        // UX: solo permitir pasar de pendiente -> completado
        if (!nextValue) return;
        if (!eventItem?.id) return;

        const currentStatus = String(eventItem.estado || '').toLowerCase();
        if (currentStatus !== 'pendiente') return;

        try {
            setUpdatingEventStatus((prev) => ({ ...prev, [eventItem.id]: true }));
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                Alert.alert('Error', 'No se encontró token de autenticación');
                return;
            }

            const resp = await fetch(`${API_ENDPOINTS.EVENTS}/${eventItem.id}/estado`, {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ estado: 'completado' }),
            });

            if (!resp.ok) {
                const errorData = await resp.json().catch(() => ({}));
                throw new Error(errorData.message || 'No se pudo actualizar el estado');
            }

            // Refrescar solo eventos/contadores para mantener el orden y la UI
            await Promise.all([fetchEvents(token), fetchEventCounts(token)]);
        } catch (err) {
            console.error('Error cambiando estado:', err);
            Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
        } finally {
            setUpdatingEventStatus((prev) => ({ ...prev, [eventItem.id]: false }));
        }
    };

    const renderEventCard = (item) => {
        const statusColor = getStatusColor(item.estado);
        const daysRemaining = getDaysRemaining(item.fecha);
        const currentStatus = String(item.estado || '').toLowerCase();
        const isCompleted = currentStatus === 'completado';
        const canToggle = currentStatus === 'pendiente';
        const isUpdating = Boolean(updatingEventStatus[item.id]);

        return (
            <TouchableOpacity
                key={item.id}
                style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusColor }]}
                onPress={() => handleEventPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.headerText}>
                        <Text style={styles.eventTitle}>{item.titulo}</Text>
                        <Text style={styles.eventCategory}>{formatCategoria(item.categoria)}</Text>
                    </View>
                    <View style={styles.cardHeaderRight}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                            <Text style={[styles.statusText, { color: statusColor }]}>{formatEstado(item.estado)}</Text>
                        </View>
                        <View
                            style={styles.completeSwitchContainer}
                            onTouchStart={(e) => e.stopPropagation && e.stopPropagation()}
                        >
                            <Text style={styles.completeSwitchLabel}>Completado</Text>
                            <Switch
                                value={isCompleted}
                                disabled={!canToggle || isUpdating || isCompleted}
                                onValueChange={(val) => handleToggleCompleted(item, val)}
                                trackColor={{ false: '#e5e7eb', true: '#10b981' }}
                                thumbColor={isCompleted ? '#ffffff' : '#ffffff'}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.cardBody}>
                    <View style={styles.eventRow}>
                        <Clock size={16} color="#6b7280" />
                        <Text style={styles.infoText}>{formatDate(item.fecha)}</Text>
                        {daysRemaining && (
                            <Text style={styles.daysRemaining}>({daysRemaining})</Text>
                        )}
                    </View>
                    <View style={styles.eventRow}>
                        <PawPrint size={14} color="#9ca3af" />
                        <Text style={styles.petRefText}>Mascota: {item.mascota.nombre}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper showHeader={true}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#5bbbe8']} />
                }
            >
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color="#5bbbe8" style={styles.loader} />
                ) : error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <>
                        <View style={styles.headerContainer}>
                            <View style={styles.headerIconContainer}>
                                <PawPrint size={20} color="#5bbbe8" />
                            </View>
                            <Text style={styles.mainTitle}>Centro de Salud</Text>
                        </View>

                        {/* Contadores de eventos por estado */}
                        <View style={styles.countersContainer}>
                            <TouchableOpacity
                                style={[styles.counterCard, { backgroundColor: '#fef3c7' }, selectedEstadoFilter === 'pendiente' && styles.counterCardActive]}
                                onPress={() => {
                                    if (selectedEstadoFilter === 'pendiente') {
                                        setSelectedEstadoFilter(null); // quitar filtro si ya está activo
                                    } else {
                                        setSelectedEstadoFilter('pendiente');
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.counterNumber}>{eventCounts.pendiente}</Text>
                                <Text style={[styles.counterLabel, { color: '#f59e0b' }]}>Pendiente</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.counterCard, { backgroundColor: '#d1fae5' }, selectedEstadoFilter === 'completado' && styles.counterCardActive]}
                                onPress={() => {
                                    if (selectedEstadoFilter === 'completado') {
                                        setSelectedEstadoFilter(null);
                                    } else {
                                        setSelectedEstadoFilter('completado');
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.counterNumber}>{eventCounts.completado}</Text>
                                <Text style={[styles.counterLabel, { color: '#10b981' }]}>Completado</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.counterCard, { backgroundColor: '#fee2e2' }, selectedEstadoFilter === 'vencido' && styles.counterCardActive]}
                                onPress={() => {
                                    if (selectedEstadoFilter === 'vencido') {
                                        setSelectedEstadoFilter(null);
                                    } else {
                                        setSelectedEstadoFilter('vencido');
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.counterNumber}>{eventCounts.vencido}</Text>
                                <Text style={[styles.counterLabel, { color: '#ef4444' }]}>Vencido</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.counterCard, { backgroundColor: '#e5e7eb' }, selectedEstadoFilter === 'cancelado' && styles.counterCardActive]}
                                onPress={() => {
                                    if (selectedEstadoFilter === 'cancelado') {
                                        setSelectedEstadoFilter(null);
                                    } else {
                                        setSelectedEstadoFilter('cancelado');
                                    }
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.counterNumber}>{eventCounts.cancelado}</Text>
                                <Text style={[styles.counterLabel, { color: '#6b7280' }]}>Cancelado</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mis Mascotas</Text>
                            {pets.length === 0 ? (
                                <Text style={styles.emptyText}>No tienes mascotas registradas.</Text>
                            ) : (
                                pets.map(pet => renderPetCard(pet))
                            )}
                        </View>

                        {/* eventos recientes de todas las mascotas */}
                        <View style={styles.section}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={styles.sectionTitle}>
                                    {selectedEstadoFilter ? `Eventos ${formatEstado(selectedEstadoFilter)}` : 'Eventos Recientes'}
                                </Text>
                                {selectedEstadoFilter && (
                                    <TouchableOpacity
                                        onPress={() => setSelectedEstadoFilter(null)}
                                        style={{ backgroundColor: '#5bbbe8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 }}
                                    >
                                        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>Limpiar filtro</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            {(() => {
                                // filtrar eventos si hay filtro activo
                                const filteredEvents = selectedEstadoFilter
                                    ? events.filter(e => e.estado.toLowerCase() === selectedEstadoFilter.toLowerCase())
                                    : events;

                                if (filteredEvents.length === 0) {
                                    return <Text style={styles.emptyText}>
                                        {selectedEstadoFilter ? `No hay eventos ${formatEstado(selectedEstadoFilter).toLowerCase()}` : 'No hay eventos registrados.'}
                                    </Text>;
                                }

                                const eventsToShow = selectedEstadoFilter ? filteredEvents : filteredEvents.slice(0, 5);

                                return (
                                    <>
                                        {eventsToShow.map(event => renderEventCard(event))}
                                        {!selectedEstadoFilter && filteredEvents.length > 5 && (
                                            <TouchableOpacity
                                                style={styles.viewAllEventsButton}
                                                onPress={() => {
                                                    setSelectedPetForEvents(null);
                                                    setPetEventsModalVisible(true);
                                                }}
                                            >
                                                <Text style={styles.viewAllEventsButtonText}>
                                                    Ver todos los {events.length} eventos
                                                </Text>
                                                <ChevronRight size={20} color="#fff" />
                                            </TouchableOpacity>
                                        )}
                                    </>
                                );
                            })()}
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Modal de detalle de evento */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedEvent && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>
                                        {isEditMode ? 'Editar Evento' : 'Detalle del Evento'}
                                    </Text>
                                </View>

                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    {!isEditMode ? (
                                        <>
                                            {/* Modo Vista */}
                                            <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedEvent.estado) + '20' }]}>
                                                <Text style={[styles.modalStatusText, { color: getStatusColor(selectedEvent.estado) }]}>
                                                    {formatEstado(selectedEvent.estado)}
                                                </Text>
                                            </View>

                                            <View style={styles.modalSection}>
                                                <Text style={styles.modalSectionTitle}>Título</Text>
                                                <Text style={styles.modalSectionContent}>{selectedEvent.titulo}</Text>
                                            </View>

                                            <View style={styles.modalSection}>
                                                <View style={styles.modalIconRow}>
                                                    <FileText size={18} color="#6b7280" />
                                                    <Text style={styles.modalSectionTitle}>Categoría</Text>
                                                </View>
                                                <Text style={styles.modalCategoryText}>{formatCategoria(selectedEvent.categoria)}</Text>
                                            </View>

                                            <View style={styles.modalSection}>
                                                <View style={styles.modalIconRow}>
                                                    <Calendar size={18} color="#6b7280" />
                                                    <Text style={styles.modalSectionTitle}>Fecha</Text>
                                                </View>
                                                <Text style={styles.modalSectionContent}>{formatDate(selectedEvent.fecha)}</Text>
                                                {getDaysRemaining(selectedEvent.fecha) && (
                                                    <Text style={styles.modalDaysRemaining}>
                                                        {getDaysRemaining(selectedEvent.fecha)}
                                                    </Text>
                                                )}
                                            </View>

                                            {selectedEvent.hora && (
                                                <View style={styles.modalSection}>
                                                    <View style={styles.modalIconRow}>
                                                        <Clock size={18} color="#6b7280" />
                                                        <Text style={styles.modalSectionTitle}>Hora</Text>
                                                    </View>
                                                    <Text style={styles.modalSectionContent}>{selectedEvent.hora}</Text>
                                                </View>
                                            )}

                                            {selectedEvent.descripcion && (
                                                <View style={styles.modalSection}>
                                                    <Text style={styles.modalSectionTitle}>Descripción</Text>
                                                    <Text style={styles.modalDescriptionText}>{selectedEvent.descripcion}</Text>
                                                </View>
                                            )}

                                            {(selectedEvent.ubicacion_clinica_lat && selectedEvent.ubicacion_clinica_lon) && (
                                                <View style={styles.modalSection}>
                                                    <View style={styles.modalIconRow}>
                                                        <MapPin size={18} color="#6b7280" />
                                                        <Text style={styles.modalSectionTitle}>Ubicación</Text>
                                                    </View>
                                                    <Text style={styles.modalSectionContent}>
                                                        Lat: {selectedEvent.ubicacion_clinica_lat}, Lon: {selectedEvent.ubicacion_clinica_lon}
                                                    </Text>
                                                    {/* Mapa estático mostrando la ubicación */}
                                                    <View style={styles.staticMapContainer}>
                                                        <MapView
                                                            style={styles.staticMap}
                                                            initialRegion={{
                                                                latitude: parseFloat(selectedEvent.ubicacion_clinica_lat),
                                                                longitude: parseFloat(selectedEvent.ubicacion_clinica_lon),
                                                                latitudeDelta: 0.005,
                                                                longitudeDelta: 0.005,
                                                            }}
                                                            scrollEnabled={false}
                                                            zoomEnabled={false}
                                                            pitchEnabled={false}
                                                            rotateEnabled={false}
                                                        >
                                                            <Marker
                                                                coordinate={{
                                                                    latitude: parseFloat(selectedEvent.ubicacion_clinica_lat),
                                                                    longitude: parseFloat(selectedEvent.ubicacion_clinica_lon),
                                                                }}
                                                                title={selectedEvent.titulo}
                                                            />
                                                        </MapView>
                                                    </View>
                                                </View>
                                            )}

                                            <View style={styles.modalSection}>
                                                <View style={styles.modalIconRow}>
                                                    <PawPrint size={18} color="#5bbbe8" />
                                                    <Text style={styles.modalSectionTitle}>Mascota</Text>
                                                </View>
                                                <View style={styles.modalPetCard}>
                                                    <Text style={styles.modalPetName}>{selectedEvent.mascota.nombre}</Text>
                                                    <Text style={styles.modalPetSpecies}>{selectedEvent.mascota.especie}</Text>
                                                </View>
                                            </View>
                                        </>
                                    ) : (
                                        <>
                                            {/* Modo Edición */}
                                            <View style={styles.modalSection}>
                                                <Text style={styles.modalSectionTitle}>Estado</Text>
                                                <View style={styles.pickerContainer}>
                                                    <Picker
                                                        selectedValue={editForm.estado}
                                                        onValueChange={(value) => setEditForm({ ...editForm, estado: value })}
                                                        style={styles.picker}
                                                    >
                                                        <Picker.Item label="Pendiente" value="pendiente" />
                                                        <Picker.Item label="Completado" value="completado" />
                                                        <Picker.Item label="Vencido" value="vencido" />
                                                    </Picker>
                                                </View>
                                            </View>

                                            <View style={styles.modalSection}>
                                                <Text style={styles.modalSectionTitle}>Título</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    value={editForm.titulo}
                                                    onChangeText={(text) => setEditForm({ ...editForm, titulo: text })}
                                                    placeholder="Título del evento"
                                                />
                                            </View>

                                            <View style={styles.modalSection}>
                                                <Text style={styles.modalSectionTitle}>Categoría</Text>
                                                {renderCategorySelector(editForm.categoria, (value) =>
                                                    setEditForm({ ...editForm, categoria: value })
                                                )}
                                            </View>

                                            <View style={styles.modalSection}>
                                                <Text style={styles.modalSectionTitle}>Hora (HH:MM)</Text>
                                                <TextInput
                                                    style={styles.input}
                                                    value={editForm.hora}
                                                    onChangeText={(text) => setEditForm({ ...editForm, hora: text })}
                                                    placeholder="19:30"
                                                />
                                            </View>

                                            <View style={styles.modalSection}>
                                                <Text style={styles.modalSectionTitle}>Descripción</Text>
                                                <TextInput
                                                    style={[styles.input, styles.textArea]}
                                                    value={editForm.descripcion}
                                                    onChangeText={(text) => setEditForm({ ...editForm, descripcion: text })}
                                                    placeholder="Descripción del evento"
                                                    multiline
                                                    numberOfLines={4}
                                                />
                                            </View>

                                            <View style={styles.modalSection}>
                                                <View style={styles.modalIconRow}>
                                                    <MapPin size={18} color="#6b7280" />
                                                    <Text style={styles.modalSectionTitle}>Ubicación</Text>
                                                </View>
                                                {editForm.lat && editForm.lon ? (
                                                    <Text style={styles.locationText}>
                                                        Lat: {parseFloat(editForm.lat).toFixed(4)}, Lon: {parseFloat(editForm.lon).toFixed(4)}
                                                    </Text>
                                                ) : (
                                                    <Text style={styles.noLocationText}>Sin ubicación definida</Text>
                                                )}
                                                <TouchableOpacity
                                                    style={styles.mapButton}
                                                    onPress={handleOpenMapModal}
                                                >
                                                    <MapPin size={18} color="#3b82f6" />
                                                    <Text style={styles.mapButtonText}>Seleccionar en mapa</Text>
                                                </TouchableOpacity>
                                            </View>

                                            <View style={styles.modalSection}>
                                                <View style={styles.modalIconRow}>
                                                    <PawPrint size={18} color="#5bbbe8" />
                                                    <Text style={styles.modalSectionTitle}>Mascota</Text>
                                                </View>
                                                <View style={styles.modalPetCard}>
                                                    <Text style={styles.modalPetName}>{selectedEvent.mascota.nombre}</Text>
                                                    <Text style={styles.modalPetSpecies}>{selectedEvent.mascota.especie}</Text>
                                                </View>
                                            </View>
                                        </>
                                    )}
                                </ScrollView>

                                {!isEditMode ? (
                                    <>
                                        {/* botones de acción */}
                                        <View style={styles.modalButtonsRow}>
                                            <TouchableOpacity
                                                style={styles.modalDeleteButton}
                                                onPress={handleDelete}
                                            >
                                                <X size={18} color="#fff" />
                                                <Text style={styles.modalDeleteButtonText}>Eliminar</Text>
                                            </TouchableOpacity>
                                            {isEventEditable(selectedEvent) && (
                                                <TouchableOpacity
                                                    style={styles.modalEditButton}
                                                    onPress={handleEditToggle}
                                                >
                                                    <Edit2 size={18} color="#fff" />
                                                    <Text style={styles.modalEditButtonText}>Editar</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                        {/* botón cerrar */}
                                        <TouchableOpacity
                                            style={styles.modalCloseButtonFull}
                                            onPress={() => setModalVisible(false)}
                                        >
                                            <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    <View style={styles.modalButtonsRow}>
                                        <TouchableOpacity
                                            style={[styles.modalCancelButton]}
                                            onPress={() => setIsEditMode(false)}
                                            disabled={saving}
                                        >
                                            <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.modalSaveButton, saving && styles.modalButtonDisabled]}
                                            onPress={handleSave}
                                            disabled={saving}
                                        >
                                            {saving ? (
                                                <ActivityIndicator color="#fff" size="small" />
                                            ) : (
                                                <>
                                                    <Save size={18} color="#fff" />
                                                    <Text style={styles.modalSaveButtonText}>Guardar</Text>
                                                </>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* Modal de mapa para seleccionar ubicación */}
            <Modal
                visible={mapModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => setMapModalVisible(false)}
            >
                <View style={styles.mapModalContainer}>
                    <View style={styles.mapModalHeader}>
                        <Text style={styles.mapModalTitle}>Seleccionar Ubicación</Text>
                        <TouchableOpacity
                            onPress={() => setMapModalVisible(false)}
                            style={styles.closeButton}
                        >
                            <X size={24} color="#6b7280" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.mapContainer}>
                        <MapView
                            style={styles.map}
                            region={mapRegion}
                            onRegionChangeComplete={handleMapRegionChange}
                        />
                        {/* Marcador fijo en el centro */}
                        <View style={styles.centerMarker}>
                            <MapPin size={40} color="#ef4444" fill="#ef4444" />
                        </View>
                    </View>

                    <View style={styles.mapModalFooter}>
                        <Text style={styles.coordinatesInfo}>
                            Lat: {mapRegion.latitude.toFixed(6)}, Lon: {mapRegion.longitude.toFixed(6)}
                        </Text>
                        <View style={styles.mapModalButtons}>
                            <TouchableOpacity
                                style={styles.mapCancelButton}
                                onPress={() => setMapModalVisible(false)}
                            >
                                <Text style={styles.mapCancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.mapConfirmButton}
                                onPress={handleConfirmLocation}
                            >
                                <Text style={styles.mapConfirmButtonText}>
                                    {isMapForCreate ? 'Seleccionar Ubicación' : 'Cambiar Ubicación'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal para crear nuevo evento */}
            <Modal
                visible={createModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setCreateModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {selectedPetForCreate && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={styles.modalTitle}>Nuevo Evento</Text>
                                    <TouchableOpacity
                                        onPress={() => setCreateModalVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <X size={24} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    {/* Mascota */}
                                    <View style={styles.modalSection}>
                                        <View style={styles.modalIconRow}>
                                            <PawPrint size={18} color="#5bbbe8" />
                                            <Text style={styles.modalSectionTitle}>Mascota</Text>
                                        </View>
                                        <View style={styles.modalPetCard}>
                                            <Text style={styles.modalPetName}>{selectedPetForCreate.nombre}</Text>
                                            <Text style={styles.modalPetSpecies}>{selectedPetForCreate.especie}</Text>
                                        </View>
                                    </View>

                                    {/* Título */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Título *</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={createForm.titulo}
                                            onChangeText={(text) => setCreateForm({ ...createForm, titulo: text })}
                                            placeholder="Título del evento"
                                        />
                                    </View>

                                    {/* Categoría */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Categoría *</Text>
                                        {renderCategorySelector(createForm.categoria, (value) =>
                                            setCreateForm({ ...createForm, categoria: value })
                                        )}
                                    </View>

                                    {/* Fecha */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Fecha *</Text>
                                        <TouchableOpacity
                                            style={styles.datePickerButton}
                                            onPress={() => setShowDatePicker(true)}
                                        >
                                            <Calendar size={18} color="#6b7280" />
                                            <Text style={styles.datePickerText}>
                                                {createForm.fecha ? formatDateForDisplay(selectedDate) : 'Seleccionar fecha'}
                                            </Text>
                                        </TouchableOpacity>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={selectedDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={handleDateChange}
                                            />
                                        )}
                                    </View>

                                    {/* Hora */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Hora (HH:MM) *</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={createForm.hora}
                                            onChangeText={(text) => setCreateForm({ ...createForm, hora: text })}
                                            placeholder="10:30"
                                        />
                                    </View>

                                    {/* Estado - solo si hay fecha y hora seleccionadas */}
                                    {createForm.fecha && createForm.hora && (
                                        <View style={styles.modalSection}>
                                            <Text style={styles.modalSectionTitle}>
                                                Estado {isCreateFormDatePast() ? '(Evento pasado) *' : ''}
                                            </Text>
                                            <View style={styles.categoryItemsRow}>
                                                {getAvailableEstados().map((estadoOption) => {
                                                    const isSelected = createForm.estado === estadoOption.value;
                                                    return (
                                                        <TouchableOpacity
                                                            key={estadoOption.value}
                                                            style={[
                                                                styles.categoryChip,
                                                                isSelected && styles.categoryChipSelected
                                                            ]}
                                                            onPress={() => setCreateForm({ ...createForm, estado: estadoOption.value })}
                                                            activeOpacity={0.8}
                                                        >
                                                            <Text style={[
                                                                styles.categoryChipText,
                                                                isSelected && styles.categoryChipTextSelected
                                                            ]}>
                                                                {estadoOption.label}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    )}

                                    {/* Descripción */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Descripción</Text>
                                        <TextInput
                                            style={[styles.input, styles.textArea]}
                                            value={createForm.descripcion}
                                            onChangeText={(text) => setCreateForm({ ...createForm, descripcion: text })}
                                            placeholder="Descripción del evento (opcional)"
                                            multiline
                                            numberOfLines={4}
                                        />
                                    </View>

                                    {/* Ubicación */}
                                    <View style={styles.modalSection}>
                                        <View style={styles.modalIconRow}>
                                            <MapPin size={18} color="#6b7280" />
                                            <Text style={styles.modalSectionTitle}>Ubicación</Text>
                                        </View>
                                        {createForm.lat && createForm.lon ? (
                                            <Text style={styles.locationText}>
                                                Lat: {parseFloat(createForm.lat).toFixed(4)}, Lon: {parseFloat(createForm.lon).toFixed(4)}
                                            </Text>
                                        ) : (
                                            <Text style={styles.noLocationText}>Sin ubicación definida</Text>
                                        )}
                                        <TouchableOpacity
                                            style={styles.mapButton}
                                            onPress={handleOpenMapForCreate}
                                        >
                                            <MapPin size={18} color="#3b82f6" />
                                            <Text style={styles.mapButtonText}>Seleccionar ubicación</Text>
                                        </TouchableOpacity>
                                    </View>
                                </ScrollView>

                                <View style={styles.modalButtonsRow}>
                                    <TouchableOpacity
                                        style={styles.modalCancelButton}
                                        onPress={() => setCreateModalVisible(false)}
                                        disabled={creating}
                                    >
                                        <Text style={styles.modalCancelButtonText}>Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalSaveButton, creating && styles.modalButtonDisabled]}
                                        onPress={handleCreateEvent}
                                        disabled={creating}
                                    >
                                        {creating ? (
                                            <ActivityIndicator color="#fff" size="small" />
                                        ) : (
                                            <>
                                                <Save size={18} color="#fff" />
                                                <Text style={styles.modalSaveButtonText}>Crear Evento</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* modal de todos los eventos */}
            <Modal
                visible={petEventsModalVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => {
                    setPetEventsModalVisible(false);
                    setSelectedPetForEvents(null);
                }}
            >
                <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
                    {/* header del modal */}
                    <View style={styles.allEventsModalHeader}>
                        <TouchableOpacity
                            onPress={() => {
                                setPetEventsModalVisible(false);
                                setSelectedPetForEvents(null);
                            }}
                            style={styles.closeButton}
                        >
                            <X size={24} color="#fff" />
                        </TouchableOpacity>

                        {selectedPetForEvents ? (
                            // header para mascota específica
                            <>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
                                    <PawPrint size={24} color="#fff" />
                                    <Text style={styles.allEventsModalTitle}>{selectedPetForEvents.nombre}</Text>
                                </View>
                                <Text style={styles.allEventsModalSubtitle}>
                                    {selectedPetForEvents.especie} • {calculateAge(selectedPetForEvents.fecha_nacimiento)}
                                </Text>
                                <Text style={[styles.allEventsModalSubtitle, { marginTop: 4 }]}>
                                    {selectedPetForEvents.events.length} {selectedPetForEvents.events.length === 1 ? 'evento' : 'eventos'}
                                </Text>
                            </>
                        ) : (
                            // header para todos los eventos
                            <>
                                <Text style={styles.allEventsModalTitle}>Todos los Eventos</Text>
                                <Text style={styles.allEventsModalSubtitle}>
                                    {events.length} {events.length === 1 ? 'evento' : 'eventos'} en total
                                </Text>
                            </>
                        )}
                    </View>

                    {/* contadores */}
                    <View style={styles.petEventsCounters}>
                        {(() => {
                            // calcular contadores según filtro
                            const eventsToCount = selectedPetForEvents ? selectedPetForEvents.events : events;
                            const counts = {
                                pendiente: eventsToCount.filter(e => e.estado.toLowerCase() === 'pendiente').length,
                                completado: eventsToCount.filter(e => e.estado.toLowerCase() === 'completado').length,
                                vencido: eventsToCount.filter(e => e.estado.toLowerCase() === 'vencido').length,
                            };

                            return (
                                <>
                                    <View style={[styles.petEventCounter, { backgroundColor: '#fef3c7' }]}>
                                        <Text style={styles.petEventCounterNumber}>{counts.pendiente}</Text>
                                        <Text style={[styles.petEventCounterLabel, { color: '#f59e0b' }]}>Pendiente</Text>
                                    </View>
                                    <View style={[styles.petEventCounter, { backgroundColor: '#d1fae5' }]}>
                                        <Text style={styles.petEventCounterNumber}>{counts.completado}</Text>
                                        <Text style={[styles.petEventCounterLabel, { color: '#10b981' }]}>Completado</Text>
                                    </View>
                                    <View style={[styles.petEventCounter, { backgroundColor: '#fee2e2' }]}>
                                        <Text style={styles.petEventCounterNumber}>{counts.vencido}</Text>
                                        <Text style={[styles.petEventCounterLabel, { color: '#ef4444' }]}>Vencido</Text>
                                    </View>
                                </>
                            );
                        })()}
                    </View>

                    {/* lista completa de eventos con scroll */}
                    <ScrollView style={{ flex: 1, padding: 16 }}>
                        {(() => {
                            const eventsToShow = selectedPetForEvents ? selectedPetForEvents.events : events;

                            if (eventsToShow.length === 0) {
                                return <Text style={styles.emptyText}>
                                    {selectedPetForEvents ? 'Esta mascota no tiene eventos' : 'No hay eventos registrados'}
                                </Text>;
                            }

                            return eventsToShow.map(event => renderEventCard(event));
                        })()}
                    </ScrollView>
                </View>
            </Modal>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 40,
    },
    headerContainer: {
        backgroundColor: '#f0f9ff',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 4,
        borderLeftColor: '#5bbbe8',
    },
    headerIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e0f2fe',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    mainTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1e40af',
        letterSpacing: 0.3,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 12,
    },
    loader: {
        marginTop: 40,
    },
    errorText: {
        color: '#ef4444',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 16,
    },
    emptyText: {
        color: '#6b7280',
        fontStyle: 'italic',
        marginLeft: 4,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    cardHeaderRight: {
        alignItems: 'flex-end',
    },
    completeSwitchContainer: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    completeSwitchLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
        fontWeight: '600',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f9ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    headerText: {
        flex: 1,
    },
    petName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    petSpecies: {
        fontSize: 14,
        color: '#6b7280',
        textTransform: 'capitalize',
    },
    eventTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    eventCategory: {
        fontSize: 12,
        color: '#6b7280',
        textTransform: 'uppercase',
        fontWeight: '600',
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    cardBody: {
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        marginLeft: 8,
        color: '#4b5563',
        fontSize: 14,
    },
    daysRemaining: {
        marginLeft: 6,
        color: '#ef4444', // Red for urgency/attention
        fontSize: 14,
        fontWeight: '500',
    },
    description: {
        color: '#6b7280',
        fontSize: 14,
        fontStyle: 'italic',
        marginTop: 4,
    },
    addEventButton: {
        marginTop: 12,
        backgroundColor: '#5bbbe8',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    addEventButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    petRefText: {
        marginLeft: 8,
        color: '#9ca3af',
        fontSize: 12,
    },
    petSection: {
        marginBottom: 20,
    },
    petSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 10,
        marginBottom: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#5bbbe8',
    },
    petSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e40af',
        marginLeft: 8,
        flex: 1,
    },
    eventCount: {
        fontSize: 12,
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    noPetEventsText: {
        color: '#9ca3af',
        fontStyle: 'italic',
        fontSize: 14,
        marginLeft: 12,
        marginBottom: 8,
    },
    countersContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 8,
    },
    counterCard: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    counterNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    counterLabel: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        textAlign: 'center',
    },
    counterCardActive: {
        borderWidth: 3,
        borderColor: '#5bbbe8',
        transform: [{ scale: 1.05 }],
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        marginBottom: 20,
    },
    modalStatusBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        marginBottom: 20,
    },
    modalStatusText: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    modalSectionContent: {
        fontSize: 16,
        color: '#1f2937',
        lineHeight: 24,
    },
    modalIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    modalCategoryText: {
        fontSize: 16,
        color: '#3b82f6',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    modalDaysRemaining: {
        fontSize: 14,
        color: '#ef4444',
        fontWeight: '600',
        marginTop: 4,
    },
    modalDescriptionText: {
        fontSize: 15,
        color: '#4b5563',
        lineHeight: 22,
    },
    modalPetCard: {
        backgroundColor: '#f0f9ff',
        padding: 12,
        borderRadius: 10,
        borderLeftWidth: 3,
        borderLeftColor: '#5bbbe8',
    },
    modalPetName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e40af',
        marginBottom: 4,
    },
    modalPetSpecies: {
        fontSize: 14,
        color: '#6b7280',
        textTransform: 'capitalize',
    },
    modalButtonsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modalEditButton: {
        flex: 1,
        backgroundColor: '#5bbbe8',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    modalEditButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalDeleteButton: {
        flex: 1,
        backgroundColor: '#ef4444',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    modalDeleteButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalCloseButtonFull: {
        backgroundColor: '#5bbbe8',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    modalCloseButton: {
        flex: 1,
        backgroundColor: '#5bbbe8',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalCancelButton: {
        flex: 1,
        backgroundColor: '#6b7280',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalSaveButton: {
        flex: 1,
        backgroundColor: '#5bbbe8',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    modalSaveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    modalButtonDisabled: {
        opacity: 0.6,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: '#1f2937',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
    },
    categoryGroups: {
        marginTop: 8,
    },
    categoryGroup: {
        marginBottom: 12,
    },
    categoryGroupTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#374151',
        marginBottom: 8,
    },
    categoryItemsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryChip: {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        marginRight: 8,
        marginBottom: 8,
    },
    categoryChipSelected: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
    },
    categoryChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#374151',
    },
    categoryChipTextSelected: {
        color: 'white',
    },
    locationText: {
        fontSize: 14,
        color: '#4b5563',
        marginBottom: 8,
    },
    noLocationText: {
        fontSize: 14,
        color: '#9ca3af',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eff6ff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#bfdbfe',
        gap: 8,
    },
    mapButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#3b82f6',
    },
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 12,
        gap: 12,
    },
    datePickerText: {
        fontSize: 15,
        color: '#1f2937',
    },
    mapModalContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    mapModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        backgroundColor: 'white',
    },
    mapModalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    centerMarker: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -20,
        marginTop: -40,
        zIndex: 1,
    },
    mapModalFooter: {
        backgroundColor: 'white',
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    coordinatesInfo: {
        fontSize: 14,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 12,
        fontWeight: '500',
    },
    mapModalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    mapCancelButton: {
        flex: 1,
        backgroundColor: '#6b7280',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    mapCancelButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    mapConfirmButton: {
        flex: 1,
        backgroundColor: '#10b981',
        padding: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    mapConfirmButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    staticMapContainer: {
        marginTop: 12,
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    staticMap: {
        flex: 1,
    },
    // estilos para botón "ver todos los eventos"
    viewAllEventsButton: {
        backgroundColor: '#5bbbe8',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginHorizontal: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    viewAllEventsButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    // estilos para modal de todos los eventos
    allEventsModalHeader: {
        backgroundColor: '#5bbbe8',
        paddingTop: 50,
        paddingBottom: 24,
        paddingHorizontal: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    allEventsModalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 12,
    },
    allEventsModalSubtitle: {
        fontSize: 16,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
    },
    petEventsCounters: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    petEventCounter: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    petEventCounterNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 4,
    },
    petEventCounterLabel: {
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
});

export default HealthCenter;
