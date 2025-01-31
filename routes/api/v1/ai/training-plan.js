// Получение текущего плана тренировок
router.get('/current', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Получаем последний план из базы данных
        const currentPlan = await TrainingPlan.findOne({
            where: { user_id: userId },
            order: [['created_at', 'DESC']]
        });

        if (!currentPlan) {
            return res.status(404).json({ message: 'План тренировок не найден' });
        }

        // Возвращаем план
        res.json(currentPlan.plan_data);
    } catch (error) {
        console.error('Ошибка при получении текущего плана:', error);
        res.status(500).json({ message: 'Внутренняя ошибка сервера' });
    }
}); 