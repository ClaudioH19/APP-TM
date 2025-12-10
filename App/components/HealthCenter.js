import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Modal } from 'react-native';
import ScreenWrapper from './ScreenWrapper';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, PawPrint, Clock, AlertCircle, CheckCircle, XCircle, X, MapPin, FileText } from 'lucide-react-native';

const HealthCenter = () => {
    const [pets, setPets] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        fetchData();
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
                fetchEvents(token)
            ]);
        } catch (err) {
            console.error(err);
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

        // Ordenar por urgencia
        const urgencyMap = {
            'vencido': 4,
            'pendiente': 3,
            'proximo': 2,
            'completado': 1
        };

        const sortedEvents = items.sort((a, b) => {
            const urgencyA = urgencyMap[a.estado.toLowerCase()] || 0;
            const urgencyB = urgencyMap[b.estado.toLowerCase()] || 0;
            return urgencyB - urgencyA;
        });

        setEvents(sortedEvents);
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    const renderPetCard = (item) => (
        <View key={item.mascota_id} style={styles.card}>
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
            </View>
        </View>
    );

    const handleEventPress = (event) => {
        setSelectedEvent(event);
        setModalVisible(true);
    };

    const renderEventCard = (item) => {
        const statusColor = getStatusColor(item.estado);
        const daysRemaining = getDaysRemaining(item.fecha);

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
                        <Text style={styles.eventCategory}>{item.categoria}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>{item.estado}</Text>
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

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Mis Mascotas</Text>
                            {pets.length === 0 ? (
                                <Text style={styles.emptyText}>No tienes mascotas registradas.</Text>
                            ) : (
                                pets.map(pet => renderPetCard(pet))
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Eventos por Mascota</Text>
                            {events.length === 0 ? (
                                <Text style={styles.emptyText}>No hay eventos registrados.</Text>
                            ) : (
                                groupEventsByPet().map(({ pet, events: petEvents }) => (
                                    <View key={pet.mascota_id} style={styles.petSection}>
                                        <View style={styles.petSectionHeader}>
                                            <PawPrint size={18} color="#5bbbe8" />
                                            <Text style={styles.petSectionTitle}>{pet.nombre}</Text>
                                            <Text style={styles.eventCount}>
                                                {petEvents.length} {petEvents.length === 1 ? 'evento' : 'eventos'}
                                            </Text>
                                        </View>
                                        {petEvents.length === 0 ? (
                                            <Text style={styles.noPetEventsText}>
                                                No hay eventos para esta mascota
                                            </Text>
                                        ) : (
                                            petEvents.map(event => renderEventCard(event))
                                        )}
                                    </View>
                                ))
                            )}
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
                                    <Text style={styles.modalTitle}>Detalle del Evento</Text>
                                    <TouchableOpacity 
                                        onPress={() => setModalVisible(false)}
                                        style={styles.closeButton}
                                    >
                                        <X size={24} color="#6b7280" />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                                    {/* Estado */}
                                    <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedEvent.estado) + '20' }]}>
                                        <Text style={[styles.modalStatusText, { color: getStatusColor(selectedEvent.estado) }]}>
                                            {selectedEvent.estado}
                                        </Text>
                                    </View>

                                    {/* Título */}
                                    <View style={styles.modalSection}>
                                        <Text style={styles.modalSectionTitle}>Título</Text>
                                        <Text style={styles.modalSectionContent}>{selectedEvent.titulo}</Text>
                                    </View>

                                    {/* Categoría */}
                                    <View style={styles.modalSection}>
                                        <View style={styles.modalIconRow}>
                                            <FileText size={18} color="#6b7280" />
                                            <Text style={styles.modalSectionTitle}>Categoría</Text>
                                        </View>
                                        <Text style={styles.modalCategoryText}>{selectedEvent.categoria}</Text>
                                    </View>

                                    {/* Fecha */}
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

                                    {/* Descripción */}
                                    {selectedEvent.descripcion && (
                                        <View style={styles.modalSection}>
                                            <Text style={styles.modalSectionTitle}>Descripción</Text>
                                            <Text style={styles.modalDescriptionText}>{selectedEvent.descripcion}</Text>
                                        </View>
                                    )}

                                    {/* Ubicación */}
                                    {selectedEvent.ubicacion && (
                                        <View style={styles.modalSection}>
                                            <View style={styles.modalIconRow}>
                                                <MapPin size={18} color="#6b7280" />
                                                <Text style={styles.modalSectionTitle}>Ubicación</Text>
                                            </View>
                                            <Text style={styles.modalSectionContent}>{selectedEvent.ubicacion}</Text>
                                        </View>
                                    )}

                                    {/* Mascota */}
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
                                </ScrollView>

                                <TouchableOpacity 
                                    style={styles.modalCloseButton}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.modalCloseButtonText}>Cerrar</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
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
    modalCloseButton: {
        backgroundColor: '#3b82f6',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default HealthCenter;
