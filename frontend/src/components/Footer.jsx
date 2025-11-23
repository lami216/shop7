const Footer = () => {
        return (
                <footer className='mt-16 border-t border-ajv-mint/50 bg-white/90'>
                        <div className='mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-ajv-moss sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10'>
                                <div>
                                        <p className='font-semibold text-ajv-green'>
                                                Association de la Jeunesse de Voullaniya
                                        </p>
                                        <p className='text-ajv-moss/80'>رابطة شباب الفلّانية - منصة عطاء ومشاركة مجتمعية.</p>
                                </div>
                                <div className='flex flex-wrap gap-4 text-ajv-moss/80'>
                                        <span>دعم العربية كامل</span>
                                        <span>هوية AJV الخضراء</span>
                                        <span>تبرع بسهولة وأمان</span>
                                </div>
                        </div>
                </footer>
        );
};

export default Footer;
