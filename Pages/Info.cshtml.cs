using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Crykit.Pages;

public class InfoModel : PageModel
{
    private readonly ILogger<IndexModel> _logger;

    public InfoModel(ILogger<IndexModel> logger)
    {
        _logger = logger;
    }

    public void OnGet()
    {

    }
}
