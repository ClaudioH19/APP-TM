import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import ScreenWrapper from './ScreenWrapper';
import { API_ENDPOINTS } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar, PawPrint, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react-native';

const HealthCenter = () => {
    const [pets, setPets] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

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
        const response = await fetch(`${API_ENDPOINTS.EVENTS}?offset=0&limit=20`, {
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

    const renderEventCard = (item) => {
        const statusColor = getStatusColor(item.estado);
        const daysRemaining = getDaysRemaining(item.fecha);

        return (
            <View key={item.id} style={[styles.card, { borderLeftWidth: 4, borderLeftColor: statusColor }]}>
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
            </View>
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
                            <Text style={styles.sectionTitle}>Eventos</Text>
                            {events.length === 0 ? (
                                <Text style={styles.emptyText}>No hay eventos registrados.</Text>
                            ) : (
                                events.map(event => renderEventCard(event))
                            )}
                        </View>
                    </>
                )}
            </ScrollView>
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
    }
});

export default HealthCenter;
