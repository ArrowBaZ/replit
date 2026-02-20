import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Language = "en" | "fr";

const translations = {
  en: {
    // Nav
    features: "Features",
    howItWorks: "How It Works",
    testimonials: "Testimonials",
    logIn: "Log In",
    getStarted: "Get Started",

    // Landing hero
    heroTitle: "Turn Your Closet Into Cash",
    heroSubtitle: "Connect with expert resellers who handle everything — from pricing to shipping. You earn, they sell.",
    startSelling: "Start Selling Now",
    learnMore: "Learn More",

    // Landing stats
    itemsSold: "Items Sold",
    happySellers: "Happy Sellers",
    expertResellers: "Expert Resellers",
    avgSellRate: "Avg. Sell Rate",

    // Landing features
    whySellzy: "Why Sellzy",
    betterWayToResell: "A Better Way to Resell",
    featuresSubtitle: "We connect sellers with trusted, local resale experts who do the hard work for you.",
    featureExpertTitle: "Expert Resale",
    featureExpertDesc: "Expert resellers evaluate, price, and list your clothing on the best platforms for maximum return.",
    featureMatchingTitle: "Personal Matching",
    featureMatchingDesc: "Get matched with a local resale expert based on your location and the type of items you have.",
    featureEarningsTitle: "Transparent Earnings",
    featureEarningsDesc: "Track every item from pickup to sale. See exactly what you earn with our clear commission structure.",

    // Landing how it works
    threeSimpleSteps: "Three Simple Steps",
    stepsSubtitle: "From closet to cash in just a few steps. Our experts handle the rest.",
    step1Title: "Submit a Request",
    step1Desc: "Tell us about your clothing items, preferred service type, and your location.",
    step2Title: "Meet Your Reseller",
    step2Desc: "A verified resale expert near you picks up and evaluates your items in person.",
    step3Title: "Earn from Sales",
    step3Desc: "Your reseller lists items on premium platforms. You get paid when they sell.",

    // Landing testimonials
    lovedBy: "Loved by Sellers and Resellers",
    testimonial1: "I cleared out my closet and made over 800 euros without lifting a finger. My reseller was professional, friendly, and got great prices.",
    testimonial2: "As a reseller, this platform gives me a steady stream of quality items and handles the logistics. I've grown my business 3x.",
    testimonial3: "The transparency is amazing. I can see exactly where each item is in the process and what I'll earn. Highly recommend!",
    seller: "Seller",
    reseller: "Reseller",

    // Landing CTA
    readyToStart: "Ready to Start?",
    ctaSubtitle: "Join thousands of sellers and resellers on Sellzy. Turn your unused clothes into money today.",

    // Landing footer
    allRightsReserved: "2026 Sellzy. All rights reserved.",

    // Sidebar
    dashboard: "Dashboard",
    myRequests: "My Requests",
    myItems: "My Items",
    messages: "Messages",
    schedule: "Schedule",
    profile: "Profile",
    availableRequests: "Available Requests",
    myAssignments: "My Assignments",
    administration: "Administration",
    reusse: "Reseller",

    // Onboarding
    welcomeToSellzy: "Welcome to Sellzy",
    letsSetUpProfile: "Let's set up your profile.",
    imASeller: "I'm a Seller",
    sellerDesc: "I have clothes to sell and want expert help.",
    imAReseller: "I'm a Reseller",
    resellerDesc: "I'm a resale expert looking for items to sell.",
    continue: "Continue",
    back: "Back",
    contactInfo: "Contact Information",
    phoneNumber: "Phone Number",
    address: "Address",
    city: "City",
    postalCode: "Postal Code",
    department: "Department",
    preferredContact: "Preferred Contact Method",
    email: "Email",
    phone: "Phone",
    sms: "SMS",
    professionalDetails: "Professional Details",
    bio: "Bio",
    bioPlaceholder: "Tell sellers about yourself and your experience...",
    resaleExperience: "Resale Experience",
    experiencePlaceholder: "Describe your experience in fashion resale...",
    siretNumber: "SIRET Number",
    siretPlaceholder: "Your business registration number (optional)",
    completeSetup: "Complete Setup",
    profileCreated: "Profile created!",
    applicationReview: "Your application is being reviewed.",
    welcomeMsg: "Welcome to Sellzy!",

    // Seller Dashboard
    welcomeBack: "Welcome back",
    sellerDashSubtitle: "Track your items and earnings at a glance.",
    totalItems: "Total Items",
    totalEarnings: "Total Earnings",
    pendingItems: "Pending Items",
    activeRequests: "Active Requests",
    recentRequests: "Recent Requests",
    viewAllRequests: "View All Requests",
    noRequests: "No requests yet",
    createFirstRequest: "Create your first request to get started.",
    newRequest: "New Request",
    itemStatus: "Item Status",
    viewAllItems: "View All Items",
    noItems: "No items yet",
    itemsAppearHere: "Items will appear here once a reseller adds them to your requests.",
    quickActions: "Quick Actions",

    // Reusse Dashboard
    reusseDashSubtitle: "Manage your assignments and earnings.",
    applicationUnderReview: "Application Under Review",
    applicationReviewMsg: "Your reseller application is being reviewed by our team. We'll notify you once it's approved. This usually takes 1-2 business days.",
    assignedItems: "Assigned Items",
    commission: "Commission",
    completedSales: "Completed Sales",
    noAvailableRequests: "No available requests",
    checkBackLater: "Check back later for new seller requests.",
    noActiveAssignments: "No active assignments",
    acceptRequestToStart: "Accept a request to start working.",

    // Admin Dashboard
    totalUsers: "Total Users",
    activeResellers: "Active Resellers",
    pendingApplications: "Pending Applications",
    totalRequests: "Total Requests",
    applications: "Applications",
    users: "Users",
    noPendingApplications: "No pending applications",
    allReviewedMsg: "All reseller applications have been reviewed.",
    approve: "Approve",
    reject: "Reject",
    pending: "Pending",

    // Requests
    requestsAvailableDesc: "Requests from sellers looking for a reseller.",
    requestsSellerDesc: "Track your resale requests.",
    requestsReusseDesc: "Requests you're working on.",
    noAvailableRequestsMsg: "No available requests right now.",
    noRequestsYet: "No requests yet.",
    createRequestBtn: "Create Request",

    // Items
    myItemsTitle: "My Items",
    noItemsYet: "No items yet",
    itemsWillAppear: "Items will appear here once a reseller adds them to your requests.",

    // Messages
    messagesTitle: "Messages",
    noConversations: "No conversations yet",
    startConversation: "Start a conversation from a request page.",
    typeMessage: "Type a message...",
    send: "Send",

    // Schedule
    scheduleTitle: "Schedule",
    upcoming: "Upcoming",
    past: "Past",
    noUpcomingMeetings: "No upcoming meetings",
    noPastMeetings: "No past meetings",

    // Profile
    profileTitle: "Profile",
    saveChanges: "Save Changes",
    saving: "Saving...",

    // Create Request
    newRequestTitle: "New Request",
    serviceType: "Service Type",
    classic: "Classic",
    classicDesc: "Standard pickup and resale of your items.",
    express: "Express",
    expressDesc: "Priority handling with faster turnaround.",
    sosDressing: "SOS Dressing",
    sosDressingDesc: "Full wardrobe cleanout and resale.",
    numberOfItems: "Estimated Number of Items",
    estimatedValue: "Estimated Value",
    meetingLocation: "Preferred Meeting Location",
    additionalNotes: "Additional Notes",
    submitRequest: "Submit Request",
    submitting: "Submitting...",
    requestCreated: "Request created!",
    resellerMatchedSoon: "A reseller will be matched with you soon.",

    // Request Detail
    requestDetail: "Request",
    created: "Created",
    assignedReseller: "Assigned Reseller",
    items: "Items",
    addItem: "Add Item",
    title: "Title",
    brand: "Brand",
    size: "Size",
    category: "Category",
    condition: "Condition",
    description: "Description",
    minPrice: "Min Price",
    maxPrice: "Max Price",
    noItemsAdded: "No items added yet.",
    meetingsSection: "Meetings",
    scheduleMeeting: "Schedule Meeting",
    date: "Date",
    time: "Time",
    location: "Location",
    duration: "Duration (min)",
    notes: "Notes",
    accept: "Accept",
    acceptRequest: "Accept Request",
    chatWithSeller: "Chat with Seller",
    chatWithReseller: "Chat with Reseller",

    // Statuses
    statusPending: "pending",
    statusMatched: "matched",
    statusScheduled: "scheduled",
    statusInProgress: "in progress",
    statusCompleted: "completed",
    statusCancelled: "cancelled",
    statusPendingApproval: "pending approval",
    statusApproved: "approved",
    statusListed: "listed",
    statusSold: "sold",

    // Errors & Toasts
    error: "Error",
    applicationUpdated: "Application updated",
    failedUpdateApplication: "Failed to update application.",
    failedUpdateProfile: "Failed to update profile.",
    failedCreateProfile: "Failed to create profile. Please try again.",
    failedCreateRequest: "Failed to create request.",
    adminSubtitle: "Manage users, applications, and platform activity.",
    locationPlaceholder: "e.g. My home, local cafe, etc.",
    notesPlaceholder: "Any details about the items, preferred timing, etc.",

    // 404
    pageNotFound: "404 Page Not Found",
    pageNotFoundDesc: "The page you're looking for doesn't exist.",

    // Categories
    catTops: "Tops",
    catBottoms: "Bottoms",
    catDresses: "Dresses",
    catOuterwear: "Outerwear",
    catShoes: "Shoes",
    catAccessories: "Accessories",

    // Conditions
    condNew: "New with tags",
    condLikeNew: "Like new",
    condGood: "Good",
    condFair: "Fair",

    // Item approval
    approvePrice: "Approve Price",
    counterOffer: "Counter Offer",
    declineItem: "Decline",
    markAsSold: "Mark as Sold",
    markAsListed: "Mark as Listed",
    salePrice: "Sale Price",
    yourEarnings: "Your Earnings",
    platformListed: "Platform Listed On",
    approvedPrice: "Approved Price",
    statusReturned: "returned",
    enterSalePrice: "Enter the sale price",
    confirmSold: "Confirm Sale",
    cancelRequest: "Cancel Request",
    completeRequest: "Complete Request",
    requestCancelled: "Request cancelled",
    requestCompleted: "Request completed",
    itemApproved: "Item approved",
    itemDeclined: "Item declined",
    counterOfferSent: "Counter offer sent",
    itemMarkedSold: "Item marked as sold",
    itemListed: "Item listed",
    earnings: "Earnings",
    totalEarned: "Total Earned",
    noEarningsYet: "No earnings yet",
    earningsWillAppear: "Earnings will appear here once items are sold.",
    sellerEarning: "Seller Earning",
    reusseEarning: "Reseller Earning",

    // Static pages
    faq: "FAQ",
    contactUs: "Contact Us",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    faqTitle: "Frequently Asked Questions",
    contactTitle: "Contact Us",
    termsTitle: "Terms of Service",
    privacyTitle: "Privacy Policy",
    sendMessage: "Send Message",
    yourName: "Your Name",
    yourEmail: "Your Email",
    subject: "Subject",
    message: "Message",
    messageSent: "Message sent!",
    contactFormDesc: "Have a question or need help? Send us a message.",
  },
  fr: {
    // Nav
    features: "Fonctionnalites",
    howItWorks: "Comment ca marche",
    testimonials: "Temoignages",
    logIn: "Connexion",
    getStarted: "Commencer",

    // Landing hero
    heroTitle: "Transformez votre garde-robe en argent",
    heroSubtitle: "Connectez-vous avec des experts en revente qui s'occupent de tout — de la tarification a l'expedition. Vous gagnez, ils vendent.",
    startSelling: "Commencer a vendre",
    learnMore: "En savoir plus",

    // Landing stats
    itemsSold: "Articles vendus",
    happySellers: "Vendeurs satisfaits",
    expertResellers: "Revendeurs experts",
    avgSellRate: "Taux de vente moyen",

    // Landing features
    whySellzy: "Pourquoi Sellzy",
    betterWayToResell: "Une meilleure facon de revendre",
    featuresSubtitle: "Nous connectons les vendeurs avec des experts en revente locaux et de confiance qui font le travail pour vous.",
    featureExpertTitle: "Revente experte",
    featureExpertDesc: "Des revendeurs experts evaluent, fixent les prix et listent vos vetements sur les meilleures plateformes pour un maximum de retour.",
    featureMatchingTitle: "Mise en relation personnalisee",
    featureMatchingDesc: "Soyez mis en relation avec un expert en revente local en fonction de votre emplacement et du type d'articles que vous avez.",
    featureEarningsTitle: "Gains transparents",
    featureEarningsDesc: "Suivez chaque article de la collecte a la vente. Voyez exactement ce que vous gagnez avec notre structure de commission claire.",

    // Landing how it works
    threeSimpleSteps: "Trois etapes simples",
    stepsSubtitle: "De l'armoire a l'argent en quelques etapes. Nos experts s'occupent du reste.",
    step1Title: "Soumettez une demande",
    step1Desc: "Parlez-nous de vos vetements, du type de service souhaite et de votre localisation.",
    step2Title: "Rencontrez votre revendeur",
    step2Desc: "Un expert en revente verifie pres de chez vous recupere et evalue vos articles en personne.",
    step3Title: "Gagnez sur les ventes",
    step3Desc: "Votre revendeur liste les articles sur des plateformes premium. Vous etes paye quand ils sont vendus.",

    // Landing testimonials
    lovedBy: "Apprecie par les vendeurs et revendeurs",
    testimonial1: "J'ai vide mon placard et gagne plus de 800 euros sans lever le petit doigt. Mon revendeur etait professionnel, sympathique et a obtenu d'excellents prix.",
    testimonial2: "En tant que revendeur, cette plateforme me donne un flux constant d'articles de qualite et gere la logistique. J'ai triple mon activite.",
    testimonial3: "La transparence est incroyable. Je peux voir exactement ou en est chaque article et ce que je vais gagner. Je recommande vivement !",
    seller: "Vendeur",
    reseller: "Revendeur",

    // Landing CTA
    readyToStart: "Pret a commencer ?",
    ctaSubtitle: "Rejoignez des milliers de vendeurs et revendeurs sur Sellzy. Transformez vos vetements inutilises en argent aujourd'hui.",

    // Landing footer
    allRightsReserved: "2026 Sellzy. Tous droits reserves.",

    // Sidebar
    dashboard: "Tableau de bord",
    myRequests: "Mes demandes",
    myItems: "Mes articles",
    messages: "Messages",
    schedule: "Planning",
    profile: "Profil",
    availableRequests: "Demandes disponibles",
    myAssignments: "Mes missions",
    administration: "Administration",
    reusse: "Revendeur",

    // Onboarding
    welcomeToSellzy: "Bienvenue sur Sellzy",
    letsSetUpProfile: "Configurons votre profil.",
    imASeller: "Je suis vendeur",
    sellerDesc: "J'ai des vetements a vendre et je veux l'aide d'un expert.",
    imAReseller: "Je suis revendeur",
    resellerDesc: "Je suis un expert en revente a la recherche d'articles a vendre.",
    continue: "Continuer",
    back: "Retour",
    contactInfo: "Coordonnees",
    phoneNumber: "Numero de telephone",
    address: "Adresse",
    city: "Ville",
    postalCode: "Code postal",
    department: "Departement",
    preferredContact: "Methode de contact preferee",
    email: "Email",
    phone: "Telephone",
    sms: "SMS",
    professionalDetails: "Details professionnels",
    bio: "Biographie",
    bioPlaceholder: "Parlez aux vendeurs de vous et de votre experience...",
    resaleExperience: "Experience en revente",
    experiencePlaceholder: "Decrivez votre experience en revente de mode...",
    siretNumber: "Numero SIRET",
    siretPlaceholder: "Votre numero d'immatriculation (optionnel)",
    completeSetup: "Terminer la configuration",
    profileCreated: "Profil cree !",
    applicationReview: "Votre candidature est en cours d'examen.",
    welcomeMsg: "Bienvenue sur Sellzy !",

    // Seller Dashboard
    welcomeBack: "Bon retour",
    sellerDashSubtitle: "Suivez vos articles et vos gains en un coup d'oeil.",
    totalItems: "Total articles",
    totalEarnings: "Gains totaux",
    pendingItems: "Articles en attente",
    activeRequests: "Demandes actives",
    recentRequests: "Demandes recentes",
    viewAllRequests: "Voir toutes les demandes",
    noRequests: "Aucune demande",
    createFirstRequest: "Creez votre premiere demande pour commencer.",
    newRequest: "Nouvelle demande",
    itemStatus: "Statut des articles",
    viewAllItems: "Voir tous les articles",
    noItems: "Aucun article",
    itemsAppearHere: "Les articles apparaitront ici une fois qu'un revendeur les ajoutera a vos demandes.",
    quickActions: "Actions rapides",

    // Reusse Dashboard
    reusseDashSubtitle: "Gerez vos missions et vos gains.",
    applicationUnderReview: "Candidature en cours d'examen",
    applicationReviewMsg: "Votre candidature de revendeur est en cours d'examen par notre equipe. Nous vous notifierons une fois approuvee. Cela prend generalement 1 a 2 jours ouvrables.",
    assignedItems: "Articles assignes",
    commission: "Commission",
    completedSales: "Ventes realisees",
    noAvailableRequests: "Aucune demande disponible",
    checkBackLater: "Revenez plus tard pour de nouvelles demandes.",
    noActiveAssignments: "Aucune mission active",
    acceptRequestToStart: "Acceptez une demande pour commencer.",

    // Admin Dashboard
    totalUsers: "Utilisateurs totaux",
    activeResellers: "Revendeurs actifs",
    pendingApplications: "Candidatures en attente",
    totalRequests: "Demandes totales",
    applications: "Candidatures",
    users: "Utilisateurs",
    noPendingApplications: "Aucune candidature en attente",
    allReviewedMsg: "Toutes les candidatures de revendeurs ont ete examinees.",
    approve: "Approuver",
    reject: "Rejeter",
    pending: "En attente",

    // Requests
    requestsAvailableDesc: "Demandes de vendeurs cherchant un revendeur.",
    requestsSellerDesc: "Suivez vos demandes de revente.",
    requestsReusseDesc: "Demandes sur lesquelles vous travaillez.",
    noAvailableRequestsMsg: "Aucune demande disponible pour le moment.",
    noRequestsYet: "Aucune demande pour le moment.",
    createRequestBtn: "Creer une demande",

    // Items
    myItemsTitle: "Mes articles",
    noItemsYet: "Aucun article",
    itemsWillAppear: "Les articles apparaitront ici une fois qu'un revendeur les ajoutera a vos demandes.",

    // Messages
    messagesTitle: "Messages",
    noConversations: "Aucune conversation",
    startConversation: "Commencez une conversation depuis une page de demande.",
    typeMessage: "Tapez un message...",
    send: "Envoyer",

    // Schedule
    scheduleTitle: "Planning",
    upcoming: "A venir",
    past: "Passe",
    noUpcomingMeetings: "Aucune reunion a venir",
    noPastMeetings: "Aucune reunion passee",

    // Profile
    profileTitle: "Profil",
    saveChanges: "Enregistrer",
    saving: "Enregistrement...",

    // Create Request
    newRequestTitle: "Nouvelle demande",
    serviceType: "Type de service",
    classic: "Classique",
    classicDesc: "Collecte et revente standard de vos articles.",
    express: "Express",
    expressDesc: "Traitement prioritaire avec un delai plus rapide.",
    sosDressing: "SOS Dressing",
    sosDressingDesc: "Vidage complet de garde-robe et revente.",
    numberOfItems: "Nombre estime d'articles",
    estimatedValue: "Valeur estimee",
    meetingLocation: "Lieu de rencontre souhaite",
    additionalNotes: "Notes supplementaires",
    submitRequest: "Soumettre la demande",
    submitting: "Envoi en cours...",
    requestCreated: "Demande creee !",
    resellerMatchedSoon: "Un revendeur vous sera attribue bientot.",

    // Request Detail
    requestDetail: "Demande",
    created: "Creee le",
    assignedReseller: "Revendeur assigne",
    items: "Articles",
    addItem: "Ajouter un article",
    title: "Titre",
    brand: "Marque",
    size: "Taille",
    category: "Categorie",
    condition: "Etat",
    description: "Description",
    minPrice: "Prix min",
    maxPrice: "Prix max",
    noItemsAdded: "Aucun article ajoute pour le moment.",
    meetingsSection: "Reunions",
    scheduleMeeting: "Planifier une reunion",
    date: "Date",
    time: "Heure",
    location: "Lieu",
    duration: "Duree (min)",
    notes: "Notes",
    accept: "Accepter",
    acceptRequest: "Accepter la demande",
    chatWithSeller: "Discuter avec le vendeur",
    chatWithReseller: "Discuter avec le revendeur",

    // Statuses
    statusPending: "en attente",
    statusMatched: "attribue",
    statusScheduled: "planifie",
    statusInProgress: "en cours",
    statusCompleted: "termine",
    statusCancelled: "annule",
    statusPendingApproval: "en attente d'approbation",
    statusApproved: "approuve",
    statusListed: "en vente",
    statusSold: "vendu",

    // 404
    // Errors & Toasts
    error: "Erreur",
    applicationUpdated: "Candidature mise a jour",
    failedUpdateApplication: "Echec de la mise a jour de la candidature.",
    failedUpdateProfile: "Echec de la mise a jour du profil.",
    failedCreateProfile: "Echec de la creation du profil. Veuillez reessayer.",
    failedCreateRequest: "Echec de la creation de la demande.",
    adminSubtitle: "Gerez les utilisateurs, les candidatures et l'activite de la plateforme.",
    locationPlaceholder: "ex. Mon domicile, un cafe, etc.",
    notesPlaceholder: "Details sur les articles, horaires preferes, etc.",

    pageNotFound: "404 Page introuvable",
    pageNotFoundDesc: "La page que vous cherchez n'existe pas.",

    // Categories
    catTops: "Hauts",
    catBottoms: "Bas",
    catDresses: "Robes",
    catOuterwear: "Manteaux",
    catShoes: "Chaussures",
    catAccessories: "Accessoires",

    // Conditions
    condNew: "Neuf avec etiquettes",
    condLikeNew: "Comme neuf",
    condGood: "Bon etat",
    condFair: "Etat correct",

    // Item approval
    approvePrice: "Approuver le prix",
    counterOffer: "Contre-offre",
    declineItem: "Refuser",
    markAsSold: "Marquer comme vendu",
    markAsListed: "Marquer en vente",
    salePrice: "Prix de vente",
    yourEarnings: "Vos gains",
    platformListed: "Plateforme de vente",
    approvedPrice: "Prix approuve",
    statusReturned: "retourne",
    enterSalePrice: "Entrez le prix de vente",
    confirmSold: "Confirmer la vente",
    cancelRequest: "Annuler la demande",
    completeRequest: "Terminer la demande",
    requestCancelled: "Demande annulee",
    requestCompleted: "Demande terminee",
    itemApproved: "Article approuve",
    itemDeclined: "Article refuse",
    counterOfferSent: "Contre-offre envoyee",
    itemMarkedSold: "Article marque comme vendu",
    itemListed: "Article mis en vente",
    earnings: "Gains",
    totalEarned: "Total gagne",
    noEarningsYet: "Pas encore de gains",
    earningsWillAppear: "Les gains apparaitront ici une fois les articles vendus.",
    sellerEarning: "Gain vendeur",
    reusseEarning: "Gain revendeur",

    // Static pages
    faq: "FAQ",
    contactUs: "Nous contacter",
    termsOfService: "Conditions d'utilisation",
    privacyPolicy: "Politique de confidentialite",
    faqTitle: "Questions frequemment posees",
    contactTitle: "Nous contacter",
    termsTitle: "Conditions d'utilisation",
    privacyTitle: "Politique de confidentialite",
    sendMessage: "Envoyer le message",
    yourName: "Votre nom",
    yourEmail: "Votre email",
    subject: "Sujet",
    message: "Message",
    messageSent: "Message envoye !",
    contactFormDesc: "Vous avez une question ou besoin d'aide ? Envoyez-nous un message.",
  },
} as const;

type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "fr",
  setLang: () => {},
  t: (key) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("sellzy-lang") as Language;
      if (stored === "en" || stored === "fr") return stored;
    }
    return "fr";
  });

  useEffect(() => {
    localStorage.setItem("sellzy-lang", lang);
  }, [lang]);

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function useTranslateStatus(status: string): string {
  const { t } = useI18n();
  const statusMap: Record<string, TranslationKey> = {
    pending: "statusPending",
    matched: "statusMatched",
    scheduled: "statusScheduled",
    in_progress: "statusInProgress",
    completed: "statusCompleted",
    cancelled: "statusCancelled",
    pending_approval: "statusPendingApproval",
    approved: "statusApproved",
    listed: "statusListed",
    sold: "statusSold",
    returned: "statusReturned",
  };
  return statusMap[status] ? t(statusMap[status]) : status.replace(/_/g, " ");
}
