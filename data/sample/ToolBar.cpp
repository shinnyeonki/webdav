#include "ToolBar.h"
ToolBar::ToolBar() {}

int ToolBar::toolNum = 0;
void ToolBar::addComponent(Component* p)
{
	tools.push_back(p);
	p->setPosX(toolNum * BOX_WIDTH);
	p->setPosY(BOX_HEIGHT);
	toolNum++;
}

void ToolBar::repaint(HDC dc)
{
	for (auto i : tools)
	{
		i->repaint(dc);
	}
}

bool ToolBar::eventHandler(ActionEvent e)
{
	for (auto i : tools)
	{
		if (i->eventHandler(e))
			return true;
	}
	return false;
}

