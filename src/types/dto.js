/**
 * DTO interfaces for all CRUD modules
 * Postman collection'dagi fieldlarga mos keladi
 * Image fieldlar upload orqali yuboriladi va numeric ID sifatida saqlanadi
 */

// ===================== NEWS =====================
export const NewsDTO = {
    getEmptyForm() {
        return {
            title: { uz: '', ru: '', en: '' },
            content: { uz: '', ru: '', en: '' },
            category: { uz: '', ru: '', en: '' },
            mainImage: null,     // numeric ID (upload orqali)
            videoUrl: '',
            isPublished: true,
            gallery: [],
        }
    },
}

// ===================== TOURS =====================
export const ToursDTO = {
    getEmptyForm() {
        return {
            location: { uz: '', ru: '', en: '' },
            country: { uz: '', ru: '', en: '' },
            image: null,          // numeric ID (upload orqali)
            dateRange: '',
            description: { uz: '', ru: '', en: '' },
            isPublished: true,
        }
    },
}

// ===================== MANAGEMENT =====================
export const ManagementDTO = {
    getEmptyForm() {
        return {
            fullName: { uz: '', ru: '', en: '' },
            position: { uz: '', ru: '', en: '' },
            bio: { uz: '', ru: '', en: '' },
            photo: null,          // numeric ID (upload orqali)
            reception: '',
            phone: '',
            order: 1,
            isActive: true,
        }
    },
}

// ===================== BIRTHDAYS =====================
export const BirthdaysDTO = {
    getEmptyForm() {
        return {
            name: { uz: '', ru: '', en: '' },
            role: { uz: '', ru: '', en: '' },
            image: null,          // numeric ID (upload orqali)
            birthDate: '',
            message: { uz: '', ru: '', en: '' },
            isActive: true,
        }
    },
}

// ===================== PARTNERS =====================
export const PartnersDTO = {
    getEmptyForm() {
        return {
            image: null,          // numeric ID (upload orqali)
            alt: { uz: '', ru: '', en: '' },
            link: '',
            order: 1,
            isActive: true,
        }
    },
}
