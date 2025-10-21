import prisma from "../prisma.js";

//Récupérer toutes les catégories avec sous-catégories
const getCategories = async (req, res) => {
    try {
        const categories = await prisma.category.findMany({
            where: {parentID: null}, //récupère uniquement les catégories principales
            include: {
                children:{
                    include: {children:true, products:true} //inclut sous-catégories et produit
                },
                products: true
            }
        });
        res.json(categories);
    }catch(error){
        console.error(error);
        res.status(500).json({error: "Erreur lors de la récupération des catégories"});
    }
};

//Récupérer une catégorie par ID avec enfants
const getCategoryById = async (req, res) => {
    const {id} = req.params;
    try {
        const category = await prisma.category.findUnique({
            where: {id: parseInt(id)},
            include: {
                children: true,
                products: true,
                parent: true
            }
        });
        if(!category) return res.status(404).json({error: "Catégorie non trouveée"});
        res.json(category);
    }   catch (error) {
        console.error(error);
        res.status(500).json({error: "Erreur lors de la récupération de la catégories"});
    }
};

//Mettre à jour une catégorie
const updateCategory = async (req, res) => {
    const {id} = req.params;
    const {name, parentID} = req.body;
    try {
        const updateCategory = await prisma.category.update({
            where: { id: parseInt(id) },
            data: {
                name,
                parentID: parentID ? parseInt(parentID) :null
            }
        });
        res.json(updateCategory);
    }catch (error) {
        console.error(error);
        res.status(500).json({error: "Erreur lors de la mise à jour de la catégories"});
    }
};

//créer une catégorie (avec option parent)
const createCategory = async (req, res) => {
    const {name, parentID} = req.body;
    try {
        const newCategory = await prisma.category.create({
            data: {
                name,
                parentID: parentID? parseInt(parentID) : null
            }
        });
        res.status(201).json(newCategory);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Erreur lors de la création de la catégorie"});
    }
}

//supprimer une catégorie
const deleteCategory = async (req, res) => {
    const  id  = parseInt(req.params.id, 10);

    if(isNaN(id)) {
        console.log(typeof(id))
        return res.status(400).json({error: "ID invalide"});
    }
    try {
        await prisma.category.delete({
            where: {id}
        });
        res.json({message: "Catégorie supprimée avec succès"});
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Erreur lors de la suppression de la catégorie"});
    }
};

export {
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
};