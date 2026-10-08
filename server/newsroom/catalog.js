export const categoryCatalog = Object.freeze({
  "actualites.france": { category: "Actualités", subcategory: "France", keywords: [
    ['France actualité OR France news', 'gouvernement OR parliament OR société'],
    ['France annonce OR France décide OR France politique', 'France official OR minister'],
    ['France entreprise OR France économie OR France technology', 'French news OR France report'],
  ] },
  "actualites.monde": { category: "Actualités", subcategory: "Monde", keywords: [
    ['world news OR international news', 'diplomacy OR government OR society'],
    ['global politics OR international affairs', 'announcement OR report OR official'],
    ['world economy OR global technology OR international culture', 'latest OR investigation'],
  ] },
  "actualites.culture": { category: "Actualités", subcategory: "Culture", keywords: [
    ['culture news OR cultural news', 'museum OR exhibition OR heritage'],
    ['cinema news OR film festival OR literature news', 'award OR announcement OR release'],
    ['French culture OR arts news', 'artist OR festival OR institution'],
  ] },
  "actualites.tech": { category: "Actualités", subcategory: "Tech", keywords: [
    ['technology news OR tech news', 'artificial intelligence OR software OR cybersecurity'],
    ['technology company announces OR tech regulation', 'research OR product OR policy'],
    ['digital technology OR innovation news', 'report OR official OR investigation'],
  ] },
  "sport.football": { category: "Sport", subcategory: "Football", keywords: [
    ['football OR soccer', 'club OR clubs OR team OR teams'],
    ['football transfer OR soccer transfer OR football signing', 'player OR manager OR coach'],
    ['football injury OR soccer injury OR football federation', 'competition OR announcement OR sanction'],
    ['football match OR soccer match OR football tournament', 'contract OR international OR latest'],
  ] },
  "sport.basketball": { category: "Sport", subcategory: "Basketball", keywords: [
    ['basketball OR NBA OR WNBA', 'player OR team OR club'],
    ['basketball transfer OR basketball signing OR NBA trade', 'coach OR injury OR contract'],
    ['EuroLeague OR international basketball OR basketball competition', 'announcement OR sanction OR tournament'],
  ] },
  "sport.rugby": { category: "Sport", subcategory: "Rugby", keywords: [
    ['rugby union OR rugby league', 'club OR player OR competition'],
    ['rugby transfer OR rugby signing OR rugby injury', 'coach OR contract OR federation'],
    ['rugby tournament OR rugby international OR rugby announcement', 'sanction OR selection OR latest'],
  ] },
  "sport.newgen": { category: "Sport", subcategory: "NEWGEN", keywords: [
    ['young football talent OR youth football academy', 'player OR prospect OR debut'],
    ['young basketball player OR basketball prospect', 'academy OR debut OR talent'],
    ['young rugby player OR rugby prospect', 'academy OR debut OR talent'],
  ] },
  "music.rap": { category: "Music", subcategory: "Rap", keywords: [
    ['rap OR rapper OR hip-hop', 'album OR single OR release'],
    ['rapper announces OR rapper releases OR hip-hop artist', 'collaboration OR tour OR label'],
    ['rap interview OR rapper interview OR rap chart', 'certification OR concert OR announcement'],
  ] },
  "music.r-b": { category: "Music", subcategory: "R&B", keywords: [
    ['R&B OR rhythm and blues', 'album OR singer OR release'],
    ['R&B artist OR R&B singer', 'collaboration OR tour OR label'],
    ['R&B interview OR R&B chart OR R&B concert', 'certification OR announcement OR new music'],
  ] },
  "music.afro": { category: "Music", subcategory: "Afro", keywords: [
    ['Afrobeats OR Afrobeat OR African music', 'artist OR album OR single'],
    ['Afrobeats artist OR African singer', 'collaboration OR tour OR release'],
    ['Afrobeats interview OR African music festival', 'label OR chart OR announcement'],
  ] },
  "music.pop": { category: "Music", subcategory: "Pop", keywords: [
    ['pop music OR pop singer OR pop artist', 'album OR single OR release'],
    ['pop artist announces OR pop singer releases', 'tour OR collaboration OR label'],
    ['pop interview OR pop chart OR pop concert', 'certification OR announcement OR new music'],
  ] },
  "music.interviews": { category: "Music", subcategory: "Interviews", keywords: [
    ['music interview OR artist interview OR singer interview', 'new interview OR discusses OR says'],
    ['rapper interview OR musician interview OR producer interview', 'statement OR announcement OR project'],
    ['exclusive interview artist OR interview music', 'album OR career OR collaboration'],
  ] },
  "music.next": { category: "Music", subcategory: "NEXT", keywords: [
    ['emerging musician OR emerging artist OR independent artist', 'debut OR new release OR first album'],
    ['new singer OR new rapper OR new music talent', 'breakthrough OR first project OR independent'],
    ['rising artist OR emerging Afrobeats artist', 'debut single OR new talent OR announcement'],
  ] },
});

export const categoryIds = Object.keys(categoryCatalog);
